import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useGlobalStreakRecalculator = () => {
  const { user } = useAuth();

  const recalculateAllUserStreaks = async () => {
    try {
      console.log("Iniciando recálculo global de sequências...");

      // Buscar todos os usuários
      const { data: users, error: usersError } = await supabase.from("profiles").select("user_id");

      if (usersError) {
        console.error("Erro ao buscar usuários:", usersError);
        return;
      }

      if (!users || users.length === 0) {
        console.log("Nenhum usuário encontrado");
        return;
      }

      // Processar cada usuário
      const updates = [];

      for (const userProfile of users) {
        try {
          // Buscar todas as sessões de leitura do usuário
          const { data: sessions, error: sessionsError } = await supabase
            .from("reading_sessions")
            .select("session_date")
            .eq("user_id", userProfile.user_id)
            .order("session_date", { ascending: true });

          if (sessionsError) {
            console.warn(
              `Erro ao buscar sessões do usuário ${userProfile.user_id}:`,
              sessionsError
            );
            continue;
          }

          let currentStreak = 0;
          let longestStreak = 0;
          let lastActivityDate = null;

          if (sessions && sessions.length > 0) {
            // Agrupar sessões por data única
            const uniqueDates = Array.from(
              new Set(
                sessions.map(session => new Date(session.session_date).toISOString().split("T")[0])
              )
            ).sort();

            lastActivityDate = uniqueDates[uniqueDates.length - 1];

            // Calcular sequência atual (de trás para frente)
            const today = new Date();
            const todayStr = today.toISOString().split("T")[0];
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split("T")[0];

            // Verificar se a última leitura foi hoje ou ontem
            if (lastActivityDate === todayStr || lastActivityDate === yesterdayStr) {
              // Calcular sequência atual
              let streakCount = 0;
              let currentDate = new Date(lastActivityDate);

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
              currentStreak = streakCount;
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
            longestStreak = Math.max(maxStreak, currentStreak);
          }

          // Adicionar à lista de updates
          updates.push({
            user_id: userProfile.user_id,
            current_streak: currentStreak,
            longest_streak: longestStreak,
            last_activity_date: lastActivityDate,
          });
        } catch (error) {
          console.error(`Erro ao processar usuário ${userProfile.user_id}:`, error);
        }
      }

      // Fazer updates em lote
      if (updates.length > 0) {
        console.log(`Atualizando sequências de ${updates.length} usuários...`);

        // Fazer updates individuais (upsert não funciona bem para updates em massa no Supabase)
        const updatePromises = updates.map(update =>
          supabase
            .from("profiles")
            .update({
              current_streak: update.current_streak,
              longest_streak: update.longest_streak,
              last_activity_date: update.last_activity_date,
            })
            .eq("user_id", update.user_id)
        );

        const results = await Promise.allSettled(updatePromises);

        const successful = results.filter(r => r.status === "fulfilled").length;
        const failed = results.filter(r => r.status === "rejected").length;

        console.log(`✅ Recálculo concluído: ${successful} sucessos, ${failed} erros`);
      }
    } catch (error) {
      console.error("Erro durante recálculo global:", error);
    }
  };

  return { recalculateAllUserStreaks };
};
