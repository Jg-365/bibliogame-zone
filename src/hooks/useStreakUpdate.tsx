import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

interface StreakUpdateData {
  hasReadToday: boolean;
}

export const useStreakUpdate = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateStreak = useMutation({
    mutationFn: async ({ hasReadToday }: StreakUpdateData) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Buscar perfil atual do usuário
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("current_streak, longest_streak, last_activity_date")
        .eq("user_id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Buscar todas as sessões de leitura para recalcular corretamente
      const { data: sessions, error: sessionsError } = await supabase
        .from("reading_sessions")
        .select("session_date")
        .eq("user_id", user.id)
        .order("session_date", { ascending: true });

      if (sessionsError) {
        console.warn("Could not fetch reading sessions:", sessionsError);
      }

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      let newCurrentStreak = 0;
      let newLongestStreak = profile?.longest_streak || 0;

      if (sessions && sessions.length > 0) {
        // Agrupar sessões por data única
        const uniqueDates = Array.from(
          new Set(
            sessions.map(session => new Date(session.session_date).toISOString().split("T")[0])
          )
        ).sort();

        // Calcular sequência atual (de trás para frente)
        const lastReadDate = uniqueDates[uniqueDates.length - 1];
        let streakCount = 0;
        let currentDate = new Date(lastReadDate);

        // Verificar se a última leitura foi hoje ou ontem
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (lastReadDate === todayStr || lastReadDate === yesterdayStr) {
          // Calcular sequência atual
          for (let i = uniqueDates.length - 1; i >= 0; i--) {
            const dateStr = uniqueDates[i];
            const checkDate = new Date(dateStr);

            if (i === uniqueDates.length - 1) {
              // Primeira data (mais recente)
              streakCount = 1;
              currentDate = checkDate;
            } else {
              // Verificar se é consecutiva
              const prevDate = new Date(currentDate);
              prevDate.setDate(prevDate.getDate() - 1);
              const prevDateStr = prevDate.toISOString().split("T")[0];

              if (dateStr === prevDateStr) {
                streakCount++;
                currentDate = checkDate;
              } else {
                // Quebrou a sequência
                break;
              }
            }
          }
          newCurrentStreak = streakCount;
        }

        // Calcular maior sequência histórica
        let tempStreak = 1;
        let maxStreak = 1;

        for (let i = 1; i < uniqueDates.length; i++) {
          const currentDateCheck = new Date(uniqueDates[i]);
          const prevDateCheck = new Date(uniqueDates[i - 1]);
          prevDateCheck.setDate(prevDateCheck.getDate() + 1);

          if (
            currentDateCheck.toISOString().split("T")[0] ===
            prevDateCheck.toISOString().split("T")[0]
          ) {
            tempStreak++;
          } else {
            maxStreak = Math.max(maxStreak, tempStreak);
            tempStreak = 1;
          }
        }
        maxStreak = Math.max(maxStreak, tempStreak);
        newLongestStreak = Math.max(newLongestStreak, maxStreak, newCurrentStreak);
      }

      // Atualizar no banco
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          current_streak: newCurrentStreak,
          longest_streak: newLongestStreak,
          last_activity_date:
            sessions && sessions.length > 0
              ? new Date(sessions[sessions.length - 1].session_date).toISOString().split("T")[0]
              : todayStr,
        })
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      return {
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        last_activity_date: todayStr,
      };
    },
    onSuccess: data => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      // Mostrar toast para conquistas de sequência
      if (data.current_streak > 0) {
        if (data.current_streak === 1) {
          toast({
            title: "🔥 Sequência iniciada!",
            description: "Continue lendo para manter sua sequência!",
          });
        } else if (data.current_streak % 7 === 0) {
          toast({
            title: `🎉 ${data.current_streak} dias consecutivos!`,
            description: "Parabéns pela dedicação!",
          });
        } else if (data.current_streak === data.longest_streak) {
          toast({
            title: "🏆 Novo recorde!",
            description: `Sua maior sequência: ${data.longest_streak} dias!`,
          });
        }
      }
    },
    onError: error => {
      console.error("Error updating streak:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar sua sequência.",
        variant: "destructive",
      });
    },
  });

  const checkStreakUpdate = async (hasReadToday: boolean) => {
    await updateStreak.mutateAsync({ hasReadToday });
  };

  return {
    updateStreak: updateStreak.mutate,
    checkStreakUpdate,
    isUpdating: updateStreak.isPending,
    error: updateStreak.error,
  };
};
