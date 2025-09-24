import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Achievement } from "@/types/reading";

export const useAchievements = () => {
  const { user } = useAuth();

  const allAchievements = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_value", { ascending: true });

      if (error) throw error;

      return (
        data?.map((achievement) => ({
          ...achievement,
          requirementType: achievement.requirement_type,
          requirementValue: achievement.requirement_value,
        })) || []
      );
    },
  });

  const userAchievements = useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_achievements")
        .select(
          `
          id,
          user_id,
          achievement_id,
          earned_at
        `
        )
        .eq("user_id", user.id);

      if (error) throw error;

      return (
        data?.map((ua: any) => ({
          id: ua.id,
          userId: ua.user_id,
          achievementId: ua.achievement_id,
          unlockedAt: ua.earned_at,
        })) || []
      );
    },
    enabled: !!user?.id,
  });

  // Combine achievements with user progress
  const achievementsWithProgress = useQuery({
    queryKey: ["achievements-progress", user?.id],
    queryFn: async () => {
      const achievements = allAchievements.data || [];
      const userAchievementsList =
        userAchievements.data || [];

      return achievements.map((achievement) => {
        const userAchievement = userAchievementsList.find(
          (ua) => ua.achievementId === achievement.id
        );

        return {
          ...achievement,
          unlocked: !!userAchievement,
          unlockedAt: userAchievement?.unlockedAt,
        };
      });
    },
    enabled:
      !!allAchievements.data && !!userAchievements.data,
  });

  return {
    achievements: achievementsWithProgress.data || [],
    isLoading:
      allAchievements.isLoading ||
      userAchievements.isLoading,
    unlockedCount:
      achievementsWithProgress.data?.filter(
        (a) => a.unlocked
      ).length || 0,
    totalCount: allAchievements.data?.length || 0,
  };
};

export const useCheckAchievements = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (userStats: {
      booksCompleted: number;
      totalPagesRead: number;
      readingStreak: number;
    }) => {
      if (!user?.id)
        throw new Error("User not authenticated");

      // Call the Supabase function to check and grant achievements
      const { data, error } = await supabase.rpc(
        "check_and_grant_achievements",
        {
          p_user_id: user.id,
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-achievements", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["achievements-progress", user?.id],
      });
    },
  });
};
