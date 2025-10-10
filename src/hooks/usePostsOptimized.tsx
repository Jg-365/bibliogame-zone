import { useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface SocialPost {
  id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_username?: string;
  user_avatar_url?: string;
  book_id?: string;
  book_title?: string;
  book_author?: string;
  book_cover_url?: string;
  is_liked: boolean;
}

export interface PostComment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_username?: string;
  user_avatar_url?: string;
}

export interface CreatePostData {
  content: string;
  book_id?: string;
  image_url?: string;
}

export interface CreateCommentData {
  post_id: string;
  content: string;
}

// Utility para detectar erros temporários vs permanentes
const isRetryableError = (error: any): boolean => {
  if (error?.message?.includes("fetch")) return true;
  if (error?.message?.includes("network")) return true;
  if (error?.message?.includes("timeout")) return true;
  if (error?.code === "PGRST301") return true; // Supabase timeout
  if (error?.status >= 500 && error?.status < 600)
    return true; // 5xx errors
  return false;
};

// Hook principal para posts com fallback strategy otimizada
export const usePosts = (limit = 20, offset = 0) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar posts do feed com estratégia de fallback
  const {
    data: posts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["social-posts", limit, offset, user?.id],
    queryFn: async (): Promise<SocialPost[]> => {
      console.log("Iniciando busca de posts...");

      try {
        // STRATEGY 1: Query direta simples (mais rápida e confiável)
        const { data: posts, error: postsError } =
          await supabase
            .from("social_posts")
            .select(
              `
            id,
            content,
            image_url,
            created_at,
            updated_at,
            user_id,
            book_id
          `
            )
            .order("created_at", { ascending: false })
            .limit(limit)
            .range(offset, offset + limit - 1);

        if (postsError) throw postsError;

        if (!posts || posts.length === 0) {
          return [];
        }

        console.log(
          `Encontrados ${posts.length} posts, buscando dados relacionados...`
        );

        // Buscar dados relacionados de forma otimizada
        const postIds = posts.map((p) => p.id);
        const userIds = [
          ...new Set(posts.map((p) => p.user_id)),
        ];
        const bookIds = [
          ...new Set(
            posts
              .filter((p) => p.book_id)
              .map((p) => p.book_id!)
          ),
        ];

        // Buscar todos os dados relacionados em paralelo com Promise.allSettled
        const [
          profilesResult,
          booksResult,
          likesResult,
          commentsResult,
        ] = await Promise.allSettled([
          // Profiles
          userIds.length > 0
            ? supabase
                .from("profiles")
                .select("id, username, avatar_url")
                .in("id", userIds)
            : Promise.resolve({ data: [] }),

          // Books
          bookIds.length > 0
            ? supabase
                .from("books")
                .select("id, title, author, cover_url")
                .in("id", bookIds)
            : Promise.resolve({ data: [] }),

          // Likes
          postIds.length > 0
            ? supabase
                .from("post_likes")
                .select("post_id, user_id")
                .in("post_id", postIds)
            : Promise.resolve({ data: [] }),

          // Comments count
          postIds.length > 0
            ? supabase
                .from("post_comments")
                .select("post_id")
                .in("post_id", postIds)
            : Promise.resolve({ data: [] }),
        ]);

        // Processar resultados (mesmo com falhas parciais)
        const profiles =
          profilesResult.status === "fulfilled"
            ? profilesResult.value.data || []
            : [];
        const books =
          booksResult.status === "fulfilled"
            ? booksResult.value.data || []
            : [];
        const likes =
          likesResult.status === "fulfilled"
            ? likesResult.value.data || []
            : [];
        const comments =
          commentsResult.status === "fulfilled"
            ? commentsResult.value.data || []
            : [];

        // Criar mapas para lookup eficiente
        const profileMap = profiles.reduce(
          (acc: any, p: any) => ({ ...acc, [p.id]: p }),
          {}
        );
        const bookMap = books.reduce(
          (acc: any, b: any) => ({ ...acc, [b.id]: b }),
          {}
        );

        const likesMap = likes.reduce(
          (acc: any, like: any) => {
            if (!acc[like.post_id]) acc[like.post_id] = [];
            acc[like.post_id].push(like);
            return acc;
          },
          {}
        );

        const commentsMap = comments.reduce(
          (acc: any, comment: any) => {
            acc[comment.post_id] =
              (acc[comment.post_id] || 0) + 1;
            return acc;
          },
          {}
        );

        // Combinar dados
        const enrichedPosts = posts.map((post) => {
          const profile = profileMap[post.user_id];
          const book = bookMap[post.book_id];
          const postLikes = likesMap[post.id] || [];

          return {
            ...post,
            user_username: profile?.username || "Usuário",
            user_avatar_url: profile?.avatar_url || null,
            book_title: book?.title || null,
            book_author: book?.author || null,
            book_cover_url: book?.cover_url || null,
            likes_count: postLikes.length,
            comments_count: commentsMap[post.id] || 0,
            is_liked: postLikes.some(
              (like: any) => like.user_id === user?.id
            ),
          };
        });

        console.log(
          `Posts enriquecidos com sucesso: ${enrichedPosts.length}`
        );
        return enrichedPosts;
      } catch (error: any) {
        console.error("Erro ao buscar posts:", error);

        // Se for erro temporal, tentar estratégia alternativa
        if (isRetryableError(error)) {
          console.log("Tentando estratégia alternativa...");

          try {
            // STRATEGY 2: RPC com timeout reduzido
            const rpcPromise = supabase.rpc(
              "get_social_posts_feed",
              {
                p_limit: Math.min(limit, 10),
                p_offset: offset,
                p_user_id: user?.id || null,
              }
            );

            const timeoutPromise = new Promise(
              (_, reject) =>
                setTimeout(
                  () =>
                    reject(
                      new Error("RPC timeout após 3s")
                    ),
                  3000
                )
            );

            const { data: rpcData, error: rpcError } =
              (await Promise.race([
                rpcPromise,
                timeoutPromise,
              ])) as any;

            if (rpcError) throw rpcError;

            console.log("RPC funcionou como fallback");
            return rpcData || [];
          } catch (rpcErr) {
            console.warn("RPC também falhou:", rpcErr);

            // STRATEGY 3: Dados mínimos sem relacionamentos
            const {
              data: minimalPosts,
              error: minimalError,
            } = await supabase
              .from("social_posts")
              .select("id, content, created_at, user_id")
              .order("created_at", { ascending: false })
              .limit(Math.min(limit, 5)); // Bem limitado

            if (minimalError) throw minimalError;

            return (minimalPosts || []).map((post) => ({
              ...post,
              image_url: null,
              updated_at: post.created_at,
              user_username: "Carregando...",
              user_avatar_url: null,
              book_id: null,
              book_title: null,
              book_author: null,
              book_cover_url: null,
              likes_count: 0,
              comments_count: 0,
              is_liked: false,
            }));
          }
        }

        throw error;
      }
    },
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minuto para dados mais frescos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      if (isRetryableError(error)) {
        return failureCount < 2;
      }
      return false;
    },
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, 3000),
  });

  // Criar novo post
  const createPostMutation = useMutation({
    mutationFn: async (postData: CreatePostData) => {
      const { data, error } = await supabase
        .from("social_posts")
        .insert({
          user_id: user!.id,
          content: postData.content,
          book_id: postData.book_id,
          image_url: postData.image_url,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["social-posts"],
      });
      toast({
        title: "Post criado!",
        description: "Seu post foi publicado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar post",
        description:
          "Não foi possível publicar seu post. Tente novamente.",
        variant: "destructive",
      });
      console.error("Error creating post:", error);
    },
  });

  // Curtir/descurtir post
  const toggleLikeMutation = useMutation({
    mutationFn: async ({
      postId,
      isLiked,
    }: {
      postId: string;
      isLiked: boolean;
    }) => {
      if (isLiked) {
        // Descurtir
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user!.id);

        if (error) throw error;
      } else {
        // Curtir
        const { error } = await supabase
          .from("post_likes")
          .insert({
            post_id: postId,
            user_id: user!.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["social-posts"],
      });
    },
    onError: (error) => {
      console.error("Error toggling like:", error);
    },
  });

  // Deletar post
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from("social_posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["social-posts"],
      });
      toast({
        title: "Post deletado",
        description: "Seu post foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao deletar post",
        description:
          "Não foi possível remover seu post. Tente novamente.",
        variant: "destructive",
      });
      console.error("Error deleting post:", error);
    },
  });

  return {
    posts,
    isLoading,
    error,
    refetch,
    createPost: createPostMutation.mutate,
    isCreatingPost: createPostMutation.isPending,
    toggleLike: toggleLikeMutation.mutate,
    isTogglingLike: toggleLikeMutation.isPending,
    deletePost: deletePostMutation.mutate,
    isDeletingPost: deletePostMutation.isPending,
  };
};

// Hook para comentários de um post específico
export const usePostComments = (postId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: comments = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: async (): Promise<PostComment[]> => {
      try {
        // Query direta sem RPC para melhor performance
        const { data, error } = await supabase
          .from("post_comments")
          .select(
            `
            id,
            content,
            created_at,
            updated_at,
            user_id,
            profiles!user_id(username, avatar_url)
          `
          )
          .eq("post_id", postId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        return (data || []).map((comment) => ({
          ...comment,
          user_username:
            (comment as any).profiles?.username ||
            "Usuário",
          user_avatar_url:
            (comment as any).profiles?.avatar_url || null,
        }));
      } catch (err) {
        console.error("Error fetching comments:", err);
        throw err;
      }
    },
    enabled: !!postId,
    staleTime: 30 * 1000, // 30 segundos para comentários
    gcTime: 2 * 60 * 1000, // 2 minutos
  });

  const createCommentMutation = useMutation({
    mutationFn: async (commentData: CreateCommentData) => {
      const { data, error } = await supabase
        .from("post_comments")
        .insert({
          post_id: commentData.post_id,
          user_id: user!.id,
          content: commentData.content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["post-comments", postId],
      });
      queryClient.invalidateQueries({
        queryKey: ["social-posts"],
      });
      toast({
        title: "Comentário adicionado!",
        description:
          "Seu comentário foi publicado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao comentar",
        description:
          "Não foi possível publicar seu comentário. Tente novamente.",
        variant: "destructive",
      });
      console.error("Error creating comment:", error);
    },
  });

  return {
    comments,
    isLoading,
    error,
    refetch,
    createComment: createCommentMutation.mutate,
    isCreatingComment: createCommentMutation.isPending,
  };
};

// Hook para upload de imagens
export const useImageUpload = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (
    file: File
  ): Promise<string | null> => {
    if (!file) return null;

    setIsUploading(true);

    try {
      // Gerar nome único para a imagem
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      toast({
        title: "Erro no upload",
        description:
          "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
      console.error("Error uploading image:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadImage,
    isUploading,
  };
};
