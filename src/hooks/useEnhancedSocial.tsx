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
  rarity: "common" | "rare" | "epic" | "legendary";
  requirement_type: string;
  requirement_value: number;
  unlocked: boolean;
  unlocked_at?: string;
  progress: number;
  progress_text: string;
}

// Hook para atividades recentes
export const useActivities = (userId?: string, limit = 20) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activities", userId || "all", limit],
    queryFn: async (): Promise<Activity[]> => {
      try {
        const { data, error } = await supabase.rpc("get_recent_activities", {
          p_user_id: userId || null,
          p_limit: limit,
          p_offset: 0,
        });

        if (error) {
          console.error("RPC Error:", error);
          // Fallback: buscar atividades diretamente da tabela
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("user_activities")
            .select(
              `
              *,
              profiles:user_id(username, avatar_url, full_name)
            `
            )
            .order("created_at", { ascending: false })
            .limit(limit);

          if (fallbackError) throw fallbackError;

          return (fallbackData || []).map(activity => ({
            ...activity,
            user_username: activity.profiles?.username,
            user_avatar_url: activity.profiles?.avatar_url,
            user_full_name: activity.profiles?.full_name,
          }));
        }

        return data || [];
      } catch (err) {
        console.error("Error fetching activities:", err);
        throw err;
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

      const { data, error } = await supabase.rpc("check_and_grant_achievements_enhanced", {
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

      const { data, error } = await supabase.rpc("create_user_activity", {
        p_user_id: user.id,
        p_activity_type: activityType,
        p_description: description,
        p_metadata: metadata,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
  });
};
