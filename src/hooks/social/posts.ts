/**
 * Posts & comments hooks — social feed, post CRUD, comments, image upload.
 *
 * Canonical home: `@/hooks/social`.
 * Re-exported from `@/hooks/usePostsOptimized` for backward compatibility.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Utilities ────────────────────────────────────────────────────────────────

const isRetryableError = (error: unknown): boolean => {
  const err = error as {
    message?: string;
    code?: string;
    status?: number;
  };
  if (err?.message?.includes("fetch")) return true;
  if (err?.message?.includes("network")) return true;
  if (err?.message?.includes("timeout")) return true;
  if (err?.code === "PGRST301") return true;
  if (err?.status !== undefined && err.status >= 500 && err.status < 600) return true;
  return false;
};

const blockedTerms = ["odio", "racista", "xingar", "ameaca", "ofensa"];
const normalizeContent = (text: string) => text.replace(/\s+/g, " ").trim();
const containsBlockedTerms = (text: string) => {
  const normalized = text.toLowerCase();
  return blockedTerms.some((term) => normalized.includes(term));
};

// ─── Posts ────────────────────────────────────────────────────────────────────

export const usePosts = (limit = 20, offset = 0) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: posts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["social-posts", limit, offset, user?.id],
    queryFn: async (): Promise<SocialPost[]> => {
      try {
        const { data: rawPosts, error: postsError } = await supabase
          .from("social_posts")
          .select("id, content, image_url, created_at, updated_at, user_id, book_id")
          .order("created_at", { ascending: false })
          .limit(limit)
          .range(offset, offset + limit - 1);

        if (postsError) throw postsError;
        if (!rawPosts?.length) return [];

        const postIds = rawPosts.map((p) => p.id);
        const userIds = [...new Set(rawPosts.map((p) => p.user_id))];
        const bookIds = [...new Set(rawPosts.filter((p) => p.book_id).map((p) => p.book_id!))];

        const [profilesResult, booksResult, likesResult, commentsResult] = await Promise.allSettled(
          [
            userIds.length > 0
              ? supabase
                  .from("profiles")
                  .select("user_id, username, avatar_url")
                  .in("user_id", userIds)
              : Promise.resolve({ data: [] }),
            bookIds.length > 0
              ? supabase.from("books").select("id, title, author, cover_url").in("id", bookIds)
              : Promise.resolve({ data: [] }),
            postIds.length > 0
              ? supabase.from("post_likes").select("post_id, user_id").in("post_id", postIds)
              : Promise.resolve({ data: [] }),
            postIds.length > 0
              ? supabase.from("post_comments").select("post_id").in("post_id", postIds)
              : Promise.resolve({ data: [] }),
          ],
        );

        const profiles =
          profilesResult.status === "fulfilled" ? (profilesResult.value.data ?? []) : [];
        const books = booksResult.status === "fulfilled" ? (booksResult.value.data ?? []) : [];
        const likes = likesResult.status === "fulfilled" ? (likesResult.value.data ?? []) : [];
        const comments =
          commentsResult.status === "fulfilled" ? (commentsResult.value.data ?? []) : [];

        const profileMap = new Map(
          (
            profiles as Array<{
              user_id: string;
              username: string;
              avatar_url: string;
            }>
          ).map((p) => [p.user_id, p]),
        );
        const bookMap = new Map(
          (
            books as Array<{
              id: string;
              title: string;
              author: string;
              cover_url: string;
            }>
          ).map((b) => [b.id, b]),
        );

        const likesMap = (
          likes as Array<{
            post_id: string;
            user_id: string;
          }>
        ).reduce<Record<string, Array<{ post_id: string; user_id: string }>>>((acc, like) => {
          if (!acc[like.post_id]) acc[like.post_id] = [];
          acc[like.post_id].push(like);
          return acc;
        }, {});

        const commentsMap = (comments as Array<{ post_id: string }>).reduce<Record<string, number>>(
          (acc, c) => {
            acc[c.post_id] = (acc[c.post_id] ?? 0) + 1;
            return acc;
          },
          {},
        );

        return rawPosts.map((post) => {
          const profile = profileMap.get(post.user_id);
          const book = post.book_id ? bookMap.get(post.book_id) : undefined;
          const postLikes = likesMap[post.id] ?? [];

          return {
            ...post,
            user_username: profile?.username ?? "Usuário",
            user_avatar_url: profile?.avatar_url ?? null,
            book_title: book?.title ?? null,
            book_author: book?.author ?? null,
            book_cover_url: book?.cover_url ?? null,
            likes_count: postLikes.length,
            comments_count: commentsMap[post.id] ?? 0,
            is_liked: postLikes.some((like) => like.user_id === user?.id),
          } as SocialPost;
        });
      } catch (error) {
        if (isRetryableError(error)) {
          // Fallback: minimal data with no relations
          const { data: minimalPosts, error: minimalError } = await supabase
            .from("social_posts")
            .select("id, content, created_at, user_id")
            .order("created_at", { ascending: false })
            .limit(Math.min(limit, 5));

          if (minimalError) throw minimalError;

          return (minimalPosts ?? []).map(
            (post) =>
              ({
                ...post,
                image_url: undefined,
                updated_at: post.created_at,
                user_username: "Carregando...",
                user_avatar_url: undefined,
                book_id: undefined,
                book_title: undefined,
                book_author: undefined,
                book_cover_url: undefined,
                likes_count: 0,
                comments_count: 0,
                is_liked: false,
              }) as SocialPost,
          );
        }
        throw error;
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 12 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previous) => previous,
    retry: (failureCount, error) => (isRetryableError(error) ? failureCount < 2 : false),
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: CreatePostData) => {
      const content = normalizeContent(postData.content);
      if (content.length < 3) throw new Error("Escreva pelo menos 3 caracteres.");
      if (containsBlockedTerms(content)) {
        throw new Error("Conteudo bloqueado pela moderacao. Ajuste o texto e tente novamente.");
      }

      const { data, error } = await supabase
        .from("social_posts")
        .insert({
          user_id: user!.id,
          content,
          book_id: postData.book_id,
          image_url: postData.image_url,
        })
        .select()
        .single();
      if (error) throw error;
      await trackEvent({
        userId: user?.id,
        eventName: "post_created",
        eventCategory: "social",
        payload: {
          hasImage: Boolean(postData.image_url),
          hasBook: Boolean(postData.book_id),
        },
      });
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
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel publicar seu post.";
      toast({
        title: "Erro ao criar post",
        description: message,
        variant: "destructive",
      });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: user!.id });
        if (error) throw error;
      }

      await trackEvent({
        userId: user?.id,
        eventName: isLiked ? "post_unliked" : "post_liked",
        eventCategory: "social",
        payload: { postId },
      });
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["social-posts"],
      }),
    onError: (error) => console.error("Error toggling like:", error),
  });

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
    onError: () => {
      toast({
        title: "Erro ao deletar post",
        description: "Não foi possível remover seu post.",
        variant: "destructive",
      });
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

// ─── Comments ─────────────────────────────────────────────────────────────────

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
      const { data, error } = await supabase
        .from("post_comments")
        .select(
          "id, content, created_at, updated_at, user_id, profiles!user_id(username, avatar_url)",
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data ?? []).map((comment) => ({
        ...comment,
        user_username:
          (comment as { profiles?: { username?: string } }).profiles?.username ?? "Usuário",
        user_avatar_url:
          (
            comment as {
              profiles?: { avatar_url?: string };
            }
          ).profiles?.avatar_url ?? undefined,
      }));
    },
    enabled: !!postId,
    staleTime: 5 * 60 * 1000,
    gcTime: 12 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previous) => previous,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (commentData: CreateCommentData) => {
      const content = normalizeContent(commentData.content);
      if (content.length < 2) throw new Error("Comentario muito curto.");
      if (containsBlockedTerms(content)) {
        throw new Error("Comentario bloqueado pela moderacao. Ajuste o conteudo.");
      }

      const { data, error } = await supabase
        .from("post_comments")
        .insert({
          post_id: commentData.post_id,
          user_id: user!.id,
          content,
        })
        .select()
        .single();
      if (error) throw error;
      await trackEvent({
        userId: user?.id,
        eventName: "comment_created",
        eventCategory: "social",
        payload: { postId: commentData.post_id },
      });
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
        description: "Seu comentário foi publicado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao comentar",
        description: "Não foi possível publicar seu comentário.",
        variant: "destructive",
      });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("post_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user!.id);
      if (error) throw error;

      await trackEvent({
        userId: user?.id,
        eventName: "comment_deleted",
        eventCategory: "social",
        payload: { postId, commentId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["post-comments", postId],
      });
      queryClient.invalidateQueries({
        queryKey: ["social-posts"],
      });
      toast({
        title: "Comentario removido",
        description: "Seu comentario foi excluido.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao excluir comentario",
        description: "Nao foi possivel excluir este comentario.",
        variant: "destructive",
      });
    },
  });

  return {
    comments,
    isLoading,
    error,
    refetch,
    createComment: createCommentMutation.mutate,
    isCreatingComment: createCommentMutation.isPending,
    deleteComment: deleteCommentMutation.mutate,
    isDeletingComment: deleteCommentMutation.isPending,
  };
};

// ─── Image upload ─────────────────────────────────────────────────────────────

export const useImageUpload = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!file) return null;
    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("images").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("images").getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload da imagem.",
        variant: "destructive",
      });
      console.error("Error uploading image:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading };
};

export default usePosts;
