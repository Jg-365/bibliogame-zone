import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Hook para prefetching inteligente
export const usePrefetchStrategies = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Prefetch dados essenciais após 2 segundos
    const prefetchTimer = setTimeout(() => {
      // Prefetch profile do usuário
      queryClient.prefetchQuery({
        queryKey: ["profile", user.id],
        queryFn: async () => {
          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutos
      });

      // Prefetch livros mais recentes
      queryClient.prefetchQuery({
        queryKey: ["recent-books"],
        queryFn: async () => {
          const { data } = await supabase
            .from("books")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(10);
          return data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutos
      });

      // Achievements serão carregados sob demanda
    }, 2000);

    return () => clearTimeout(prefetchTimer);
  }, [user, queryClient]);

  // Prefetch on hover para navegação
  const prefetchOnHover = {
    onMouseEnter: (
      queryKey: string[],
      queryFn: () => Promise<any>
    ) => {
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
        staleTime: 2 * 60 * 1000,
      });
    },
  };

  return { prefetchOnHover };
};

// Invalidação inteligente de cache
export const useSmartCacheInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateRelatedQueries = {
    // Quando criar um post
    onPostCreated: () => {
      queryClient.invalidateQueries({
        queryKey: ["social-posts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-posts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["activity-feed"],
      });
    },

    // Quando curtir um post
    onPostLiked: (postId: string) => {
      queryClient.invalidateQueries({
        queryKey: ["social-posts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["post", postId],
      });
    },

    // Quando completar uma sessão de leitura
    onReadingSessionComplete: (bookId: string) => {
      queryClient.invalidateQueries({
        queryKey: ["reading-sessions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["book", bookId],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-stats"],
      });
      queryClient.invalidateQueries({
        queryKey: ["achievements"],
      });
      queryClient.invalidateQueries({
        queryKey: ["streaks"],
      });
    },

    // Quando atualizar perfil
    onProfileUpdated: (userId: string) => {
      queryClient.invalidateQueries({
        queryKey: ["profile", userId],
      });
      queryClient.invalidateQueries({
        queryKey: ["social-posts"],
      });
      queryClient.invalidateQueries({
        queryKey: ["leaderboard"],
      });
    },
  };

  return invalidateRelatedQueries;
};

// Limpeza automática de cache antigo
export const useCacheCleanup = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Limpar cache a cada 30 minutos
    const cleanupInterval = setInterval(() => {
      queryClient.clear();
      console.log("Cache limpo automaticamente");
    }, 30 * 60 * 1000);

    return () => clearInterval(cleanupInterval);
  }, [queryClient]);
};

// Configurações de cache específicas por tipo de dados
export const CACHE_STRATEGIES = {
  // Dados dinâmicos (posts, comentários)
  DYNAMIC: {
    staleTime: 1 * 60 * 1000, // 1 minuto
    gcTime: 5 * 60 * 1000, // 5 minutos
  },

  // Dados semi-estáticos (perfis, livros)
  SEMI_STATIC: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
  },

  // Dados estáticos (achievements, configurações)
  STATIC: {
    staleTime: 30 * 60 * 1000, // 30 minutos
    gcTime: 60 * 60 * 1000, // 1 hora
  },

  // Dados críticos (auth, sessões)
  CRITICAL: {
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 2 * 60 * 1000, // 2 minutos
  },
};
