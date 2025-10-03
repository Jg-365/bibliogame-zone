import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Activity {
  id: string;
  user_id: string;
  activity_type:
    | "book_added"
    | "book_completed"
    | "book_started"
    | "reading_session"
    | "post_created"
    | "post_liked"
    | "comment_added"
    | "achievement_unlocked"
    | "profile_updated";
  description: string;
  metadata: any;
  created_at: string;
  user_username?: string;
  user_avatar_url?: string;
  user_full_name?: string;
}

export interface EnhancedAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: string;
  requirement_type: string;
  requirement_value: number;
  unlocked: boolean;
  unlocked_at?: string;
  progress: number;
  progress_text: string;
}

// Hook para atividades recentes - baseado em posts sociais como proxy
export const useActivities = (userId?: string, limit = 20) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activities", userId || "all", limit],
    queryFn: async (): Promise<Activity[]> => {
      try {
        // Buscar posts sociais
        const { data: posts, error: postsError } = await supabase
          .from("social_posts")
          .select(
            `
            id,
            content,
            created_at,
            user_id,
            book_id
          `
          )
          .order("created_at", { ascending: false })
          .limit(limit);

        if (postsError) throw postsError;

        if (!posts || posts.length === 0) return [];

        // Buscar perfis dos usuários dos posts
        const userIds = [...new Set(posts.map(post => post.user_id))];
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url, full_name")
          .in("user_id", userIds);

        if (profilesError) {
          console.warn("Error fetching profiles:", profilesError);
        }

        // Buscar informações dos livros (se houver)
        const bookIds = posts.filter(post => post.book_id).map(post => post.book_id!);
        let books: any[] = [];
        if (bookIds.length > 0) {
          const { data: booksData, error: booksError } = await supabase
            .from("books")
            .select("id, title, author")
            .in("id", bookIds);

          if (booksError) {
            console.warn("Error fetching books:", booksError);
          } else {
            books = booksData || [];
          }
        }

        // Combinar dados
        return posts.map(post => {
          const profile = profiles?.find(p => p.user_id === post.user_id);
          const book = books.find(b => b.id === post.book_id);

          return {
            id: post.id,
            user_id: post.user_id,
            activity_type: post.book_id ? "book_post" : ("general_post" as any),
            description: post.content,
            metadata: {
              book_title: book?.title,
              book_author: book?.author,
            },
            created_at: post.created_at || new Date().toISOString(),
            user_username: profile?.username,
            user_avatar_url: profile?.avatar_url,
            user_full_name: profile?.full_name,
          };
        });
      } catch (err) {
        console.error("Error fetching activities:", err);
        return [];
      }
    },
    enabled: !!user,
  });
};

// Hook aprimorado para conquistas
export const useEnhancedAchievements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todas as conquistas
  const { data: allAchievements = [], isLoading: isLoadingAchievements } = useQuery({
    queryKey: ["achievements-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_value", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar conquistas do usuário
  const { data: userAchievements = [], isLoading: isLoadingUserAchievements } = useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Buscar estatísticas do usuário
  const { data: userStats } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      // Buscar estatísticas adicionais
      const [postsCount, likesReceived, booksAdded, reviewsWritten] = await Promise.all([
        supabase.from("social_posts").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase
          .from("post_likes")
          .select("id", { count: "exact" })
          .in(
            "post_id",
            await supabase
              .from("social_posts")
              .select("id")
              .eq("user_id", user.id)
              .then(res => res.data?.map(p => p.id) || [])
          ),
        supabase.from("books").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase
          .from("books")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .not("review", "is", null),
      ]);

      return {
        ...data,
        posts_created: postsCount.count || 0,
        likes_received: likesReceived.count || 0,
        books_added: booksAdded.count || 0,
        reviews_written: reviewsWritten.count || 0,
      };
    },
    enabled: !!user?.id,
  });

  // Combinar dados para criar conquistas enriquecidas
  const enrichedAchievements: EnhancedAchievement[] = allAchievements.map(achievement => {
    const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
    const isUnlocked = !!userAchievement;

    // Calcular progresso
    let currentValue = 0;
    if (userStats) {
      switch (achievement.requirement_type) {
        case "books_read":
          currentValue = userStats.books_completed || 0;
          break;
        case "pages_read":
          currentValue = userStats.total_pages_read || 0;
          break;
        case "streak_days":
          currentValue = Math.max(userStats.current_streak || 0, userStats.longest_streak || 0);
          break;
        case "posts_created":
          currentValue = userStats.posts_created || 0;
          break;
        case "likes_received":
          currentValue = userStats.likes_received || 0;
          break;
        case "books_added":
          currentValue = userStats.books_added || 0;
          break;
        case "reviews_written":
          currentValue = userStats.reviews_written || 0;
          break;
        default:
          currentValue = 0;
      }
    }

    const progress = Math.min((currentValue / achievement.requirement_value) * 100, 100);
    const progressText = `${currentValue}/${achievement.requirement_value}`;

    return {
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      rarity: achievement.rarity,
      requirement_type: achievement.requirement_type,
      requirement_value: achievement.requirement_value,
      unlocked: isUnlocked,
      unlocked_at: userAchievement?.unlocked_at,
      progress,
      progress_text: progressText,
    };
  });

  // Verificar conquistas
  const checkAchievements = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      // Usar a função RPC existente
      const { data, error } = await supabase.rpc("check_and_grant_achievements", {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data || [];
    },
    onSuccess: newAchievements => {
      if (newAchievements.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
        queryClient.invalidateQueries({ queryKey: ["activities"] });

        // Mostrar toast para conquistas desbloqueadas
        newAchievements.forEach((achievement: any) => {
          toast({
            title: "🏆 Conquista Desbloqueada!",
            description: `${achievement.icon} ${achievement.title} - ${achievement.description}`,
          });
        });
      }
    },
    onError: error => {
      console.error("Error checking achievements:", error);
    },
  });

  const unlockedCount = enrichedAchievements.filter(a => a.unlocked).length;
  const totalCount = enrichedAchievements.length;

  return {
    achievements: enrichedAchievements,
    isLoading: isLoadingAchievements || isLoadingUserAchievements,
    unlockedCount,
    totalCount,
    checkAchievements: checkAchievements.mutate,
    isCheckingAchievements: checkAchievements.isPending,
  };
};

// Hook para criar atividade manual (se necessário)
export const useCreateActivity = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      activityType,
      description,
      metadata = {},
    }: {
      activityType: Activity["activity_type"];
      description: string;
      metadata?: any;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Como não temos tabela user_activities, criamos um post social para registrar a atividade
      const { data, error } = await supabase
        .from("social_posts")
        .insert({
          user_id: user.id,
          content: description,
          book_id: metadata.book_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
    },
  });
};
