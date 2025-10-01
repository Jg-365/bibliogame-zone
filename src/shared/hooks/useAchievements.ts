import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "./useToast";
import { getErrorMessage } from "@/shared/utils";
import { QUERY_KEYS } from "@/shared/types";
import type { Achievement } from "@/shared/types";

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

interface EnrichedAchievement extends Achievement {
  unlocked: boolean;
  unlockedAt?: string;
}

/**
 * Optimized hook for achievements management with intelligent caching
 */
export const useAchievements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all available achievements
  const {
    data: allAchievements = [],
    isLoading: isLoadingAll,
  } = useQuery({
    queryKey: ["achievements"],
    queryFn: async (): Promise<Achievement[]> => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_value", { ascending: true });

      if (error) throw error;

      return (data || []).map((achievement) => ({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        rarity: achievement.rarity as Achievement["rarity"],
        requirementType: achievement.requirement_type,
        requirementValue: achievement.requirement_value,
      }));
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - achievements rarely change
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  // Fetch user's unlocked achievements
  const {
    data: userAchievements = [],
    isLoading: isLoadingUser,
  } = useQuery({
    queryKey: QUERY_KEYS.achievements(user?.id || ""),
    queryFn: async (): Promise<UserAchievement[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Unlock achievement mutation
  const unlockAchievementMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      if (!user?.id)
        throw new Error("User not authenticated");

      // Check if already unlocked
      const isAlreadyUnlocked = userAchievements.some(
        (ua) => ua.achievement_id === achievementId
      );

      if (isAlreadyUnlocked) {
        throw new Error("Achievement already unlocked");
      }

      const { data, error } = await supabase
        .from("user_achievements")
        .insert({
          user_id: user.id,
          achievement_id: achievementId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newUserAchievement) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        QUERY_KEYS.achievements(user?.id || ""),
        (oldUserAchievements: UserAchievement[] = []) => [
          ...oldUserAchievements,
          newUserAchievement,
        ]
      );

      // Find the achievement details for the toast
      const achievement = allAchievements.find(
        (a) => a.id === newUserAchievement.achievement_id
      );

      toast({
        title: "🏆 Conquista Desbloqueada!",
        description: achievement
          ? `${achievement.title} - ${achievement.description}`
          : "Nova conquista desbloqueada!",
      });

      // Invalidate profile to update points/level
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profile(user?.id || ""),
      });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      if (!errorMessage.includes("already unlocked")) {
        toast({
          title: "Erro ao desbloquear conquista",
          description: errorMessage,
          variant: "destructive",
        });
      }
    },
  });

  // Check and unlock achievements based on user stats
  const checkAchievementsMutation = useMutation({
    mutationFn: async (userStats: {
      booksCompleted: number;
      totalPagesRead: number;
      currentStreak: number;
      points: number;
    }) => {
      if (!user?.id)
        throw new Error("User not authenticated");

      const unlockedIds = new Set(
        userAchievements.map((ua) => ua.achievement_id)
      );
      const newUnlocks: string[] = [];

      // Check each achievement
      for (const achievement of allAchievements) {
        if (unlockedIds.has(achievement.id)) continue;

        let shouldUnlock = false;

        switch (achievement.requirementType) {
          case "books_completed":
            shouldUnlock =
              userStats.booksCompleted >=
              achievement.requirementValue;
            break;
          case "pages_read":
            shouldUnlock =
              userStats.totalPagesRead >=
              achievement.requirementValue;
            break;
          case "streak_days":
            shouldUnlock =
              userStats.currentStreak >=
              achievement.requirementValue;
            break;
          case "points":
            shouldUnlock =
              userStats.points >=
              achievement.requirementValue;
            break;
        }

        if (shouldUnlock) {
          newUnlocks.push(achievement.id);
        }
      }

      // Bulk unlock achievements
      if (newUnlocks.length > 0) {
        const { data, error } = await supabase
          .from("user_achievements")
          .insert(
            newUnlocks.map((achievementId) => ({
              user_id: user.id!,
              achievement_id: achievementId,
            }))
          )
          .select();

        if (error) throw error;
        return data || [];
      }

      return [];
    },
    onSuccess: (newUnlocks) => {
      if (newUnlocks.length > 0) {
        // Update cache
        queryClient.setQueryData(
          QUERY_KEYS.achievements(user?.id || ""),
          (oldUserAchievements: UserAchievement[] = []) => [
            ...oldUserAchievements,
            ...newUnlocks,
          ]
        );

        // Show notification for multiple unlocks
        if (newUnlocks.length === 1) {
          const achievement = allAchievements.find(
            (a) => a.id === newUnlocks[0].achievement_id
          );
          toast({
            title: "🏆 Conquista Desbloqueada!",
            description: achievement
              ? `${achievement.title} - ${achievement.description}`
              : "Nova conquista desbloqueada!",
          });
        } else {
          toast({
            title: "🏆 Múltiplas Conquistas!",
            description: `Parabéns! Você desbloqueou ${newUnlocks.length} conquistas!`,
          });
        }

        // Invalidate profile
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.profile(user?.id || ""),
        });
      }
    },
  });

  // Combine achievements with user unlock status
  const enrichedAchievements: EnrichedAchievement[] =
    allAchievements.map((achievement) => {
      const userAchievement = userAchievements.find(
        (ua) => ua.achievement_id === achievement.id
      );
      return {
        ...achievement,
        unlocked: !!userAchievement,
        unlockedAt: userAchievement?.unlocked_at,
      };
    });

  // Group achievements by status
  const achievementsByStatus = {
    unlocked: enrichedAchievements.filter(
      (a) => a.unlocked
    ),
    locked: enrichedAchievements.filter((a) => !a.unlocked),
  };

  // Group by rarity
  const achievementsByRarity = {
    common: enrichedAchievements.filter(
      (a) => a.rarity === "common"
    ),
    rare: enrichedAchievements.filter(
      (a) => a.rarity === "rare"
    ),
    epic: enrichedAchievements.filter(
      (a) => a.rarity === "epic"
    ),
    legendary: enrichedAchievements.filter(
      (a) => a.rarity === "legendary"
    ),
  };

  const stats = {
    total: allAchievements.length,
    unlocked: achievementsByStatus.unlocked.length,
    locked: achievementsByStatus.locked.length,
    completionPercentage:
      allAchievements.length > 0
        ? Math.round(
            (achievementsByStatus.unlocked.length /
              allAchievements.length) *
              100
          )
        : 0,
  };

  return {
    // Data
    allAchievements,
    userAchievements,
    enrichedAchievements,
    achievementsByStatus,
    achievementsByRarity,
    stats,

    // Loading states
    isLoading: isLoadingAll || isLoadingUser,
    isUnlocking: unlockAchievementMutation.isPending,
    isChecking: checkAchievementsMutation.isPending,

    // Actions
    unlockAchievement: unlockAchievementMutation.mutate,
    checkAchievements: checkAchievementsMutation.mutate,

    // Async actions
    unlockAchievementAsync:
      unlockAchievementMutation.mutateAsync,
    checkAchievementsAsync:
      checkAchievementsMutation.mutateAsync,
  };
};
