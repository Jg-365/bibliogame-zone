import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Achievement } from "@/shared/types";

// Shape returned by the user_achievement_progress view
interface AchievementProgress extends Achievement {
  unlocked: boolean;
  unlocked_at: string | null;
  user_achievement_id: string | null;
  user_id: string | null;
}

const shouldFallbackAchievementsView = (error: { code?: string; message?: string } | null) => {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.message?.includes("user_achievement_progress") ||
    error.message?.includes("Could not find")
  );
};

const loadAchievementsFallback = async (userId: string): Promise<AchievementProgress[]> => {
  const [
    { data: achievements, error: achievementsError },
    { data: unlockedRows, error: unlockedError },
  ] = await Promise.all([
    supabase.from("achievements").select("*").order("requirement_value", { ascending: true }),
    supabase.from("user_achievements").select("*").eq("user_id", userId),
  ]);

  if (achievementsError) throw achievementsError;
  if (unlockedError) throw unlockedError;

  const unlockedMap = new Map(
    (unlockedRows ?? []).map((row) => [row.achievement_id, row] as const),
  );

  return (achievements ?? []).map((achievement) => {
    const unlocked = unlockedMap.get(achievement.id);
    return {
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      rarity: achievement.rarity as Achievement["rarity"],
      requirementType: achievement.requirement_type,
      requirementValue: achievement.requirement_value,
      unlocked: Boolean(unlocked),
      unlockedAt: unlocked?.unlocked_at ?? undefined,
      unlocked_at: unlocked?.unlocked_at ?? null,
      user_achievement_id: unlocked?.id ?? null,
      user_id: unlocked?.user_id ?? null,
    };
  });
};

export const useAchievements = () => {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["achievements-progress", user?.id],
    queryFn: async (): Promise<AchievementProgress[]> => {
      if (!user?.id) return [];

      const { data: rows, error } = await supabase
        .from("user_achievement_progress" as never)
        .select("*")
        .order("requirement_value", { ascending: true });

      if (error) {
        if (shouldFallbackAchievementsView(error)) {
          return loadAchievementsFallback(user.id);
        }
        throw error;
      }

      return (rows ?? []) as AchievementProgress[];
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previous) => previous,
  });

  const achievements = data ?? [];

  return {
    achievements,
    isLoading,
    unlockedCount: achievements.filter((a) => a.unlocked).length,
    totalCount: achievements.length,
  };
};

export const useCheckAchievements = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (_userStats: {
      booksCompleted: number;
      totalPagesRead: number;
      readingStreak: number;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase.rpc("check_and_grant_achievements", {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate the unified view's query key
      queryClient.invalidateQueries({ queryKey: ["achievements-progress", user?.id] });
    },
  });
};
