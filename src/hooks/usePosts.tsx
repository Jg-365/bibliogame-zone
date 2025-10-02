import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

// Hook principal para posts
export const usePosts = (limit = 20, offset = 0) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar posts do feed
  const {
    data: posts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["social-posts", limit, offset, user?.id],
    queryFn: async (): Promise<SocialPost[]> => {
      const { data, error } = await supabase.rpc("get_social_posts_feed", {
        p_limit: limit,
        p_offset: offset,
        p_user_id: user?.id || null,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
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
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      toast({
        title: "Post criado!",
        description: "Seu post foi publicado com sucesso.",
      });
    },
    onError: error => {
      toast({
        title: "Erro ao criar post",
        description: "Não foi possível publicar seu post. Tente novamente.",
        variant: "destructive",
      });
      console.error("Error creating post:", error);
    },
  });

  // Curtir/descurtir post
  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
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
        const { error } = await supabase.from("post_likes").insert({
          post_id: postId,
          user_id: user!.id,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
    },
    onError: error => {
      toast({
        title: "Erro",
        description: "Não foi possível curtir o post. Tente novamente.",
        variant: "destructive",
      });
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
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      toast({
        title: "Post excluído",
        description: "Seu post foi excluído com sucesso.",
      });
    },
    onError: error => {
      toast({
        title: "Erro ao excluir post",
        description: "Não foi possível excluir o post. Tente novamente.",
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

  // Buscar comentários
  const {
    data: comments = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: async (): Promise<PostComment[]> => {
      const { data, error } = await supabase.rpc("get_post_comments", {
        p_post_id: postId,
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!postId && !!user,
  });

  // Criar comentário
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
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      toast({
        title: "Comentário adicionado!",
        description: "Seu comentário foi publicado com sucesso.",
      });
    },
    onError: error => {
      toast({
        title: "Erro ao comentar",
        description: "Não foi possível adicionar seu comentário.",
        variant: "destructive",
      });
      console.error("Error creating comment:", error);
    },
  });

  // Deletar comentário
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("post_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
      toast({
        title: "Comentário excluído",
        description: "Seu comentário foi excluído com sucesso.",
      });
    },
    onError: error => {
      toast({
        title: "Erro ao excluir comentário",
        description: "Não foi possível excluir o comentário.",
        variant: "destructive",
      });
      console.error("Error deleting comment:", error);
    },
  });

  return {
    comments,
    isLoading,
    error,
    createComment: createCommentMutation.mutate,
    isCreatingComment: createCommentMutation.isPending,
    deleteComment: deleteCommentMutation.mutate,
    isDeletingComment: deleteCommentMutation.isPending,
  };
};

// Hook para upload de imagens
export const useImageUpload = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!file) return null;

    setIsUploading(true);

    try {
      // Gerar nome único para a imagem
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage.from("images").upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
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

  return {
    uploadImage,
    isUploading,
  };
};
