import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useToast } from "./use-toast";

interface StreakUpdateData {
  hasReadToday: boolean;
}

export const useStreakUpdate = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStreak = useMutation({
    mutationFn: async ({
      hasReadToday,
    }: StreakUpdateData) => {
      if (!user?.id)
        throw new Error("User not authenticated");

      // Get current profile data
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select(
            "reading_streak, best_streak, last_activity"
          )
          .eq("user_id", user.id)
          .single();

      if (profileError) throw profileError;

      const today = new Date().toISOString().split("T")[0];
      const lastReadDate = profile?.last_activity
        ? new Date(profile.last_activity)
            .toISOString()
            .split("T")[0]
        : null;

      let newCurrentStreak = profile?.reading_streak || 0;
      let newLongestStreak = profile?.best_streak || 0;

      if (hasReadToday) {
        // Check if this is a new day
        if (lastReadDate !== today) {
          // Check if yesterday was read (streak continues)
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday
            .toISOString()
            .split("T")[0];

          if (
            lastReadDate === yesterdayStr ||
            newCurrentStreak === 0
          ) {
            // Continue streak or start new one
            newCurrentStreak += 1;
          } else {
            // Broke streak, start over
            newCurrentStreak = 1;
          }

          // Update longest streak if needed
          if (newCurrentStreak > newLongestStreak) {
            newLongestStreak = newCurrentStreak;
          }

          // Update profile
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              reading_streak: newCurrentStreak,
              best_streak: newLongestStreak,
              last_activity: today,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id);

          if (updateError) throw updateError;
        }
      } else {
        // Check if streak should be broken
        const now = new Date();
        const lastRead = lastReadDate
          ? new Date(lastReadDate)
          : null;

        if (lastRead) {
          const daysDiff = Math.floor(
            (now.getTime() - lastRead.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          // If more than 1 day has passed without reading, break the streak
          if (daysDiff > 1 && newCurrentStreak > 0) {
            newCurrentStreak = 0;

            const { error: updateError } = await supabase
              .from("profiles")
              .update({
                reading_streak: newCurrentStreak,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", user.id);

            if (updateError) throw updateError;
          }
        }
      }

      return {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        wasUpdated: lastReadDate !== today,
      };
    },
    onSuccess: (result) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["profile", user?.id],
      });

      // Show toast if streak increased
      if (result.currentStreak > 0 && result.wasUpdated) {
        if (result.currentStreak === 1) {
          toast({
            title: "🔥 Sequência iniciada!",
            description:
              "Continue lendo todos os dias para manter sua sequência!",
          });
        } else if (
          result.currentStreak === result.longestStreak
        ) {
          toast({
            title: "🏆 Novo recorde de sequência!",
            description: `${result.currentStreak} dias seguidos! Parabéns!`,
          });
        } else if (result.currentStreak % 7 === 0) {
          toast({
            title: `🔥 ${result.currentStreak} dias de sequência!`,
            description:
              "Você está em chamas! Continue assim!",
          });
        }
      }
    },
    onError: (error: any) => {
      console.error("Error updating streak:", error);
      toast({
        title: "Erro ao atualizar sequência",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check and update streak automatically
  const checkStreakUpdate = useMutation({
    mutationFn: async () => {
      if (!user?.id) return null;

      // Get today's reading sessions
      const today = new Date().toISOString().split("T")[0];

      const { data: todaySessions, error } = await supabase
        .from("reading_sessions")
        .select("pages_read")
        .eq("user_id", user.id)
        .gte("session_date", `${today}T00:00:00Z`)
        .lt("session_date", `${today}T23:59:59Z`);

      if (error) throw error;

      const hasReadToday =
        todaySessions &&
        todaySessions.length > 0 &&
        todaySessions.some(
          (session) => session.pages_read > 0
        );

      return updateStreak.mutateAsync({
        hasReadToday: !!hasReadToday,
      });
    },
  });

  return {
    updateStreak: updateStreak.mutate,
    checkStreakUpdate: checkStreakUpdate.mutate,
    isUpdatingStreak:
      updateStreak.isPending || checkStreakUpdate.isPending,
  };
};
