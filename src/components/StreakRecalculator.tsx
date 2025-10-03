import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Calculator, RefreshCw } from "lucide-react";

export const StreakRecalculator = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRecalculating, setIsRecalculating] = React.useState(false);

  const recalculateStreak = async () => {
    if (!user?.id) return;

    setIsRecalculating(true);
    try {
      // Buscar todas as sessões de leitura ordenadas por data
      const { data: sessions, error: sessionsError } = await supabase
        .from("reading_sessions")
        .select("session_date")
        .eq("user_id", user.id)
        .order("session_date", { ascending: true });

      if (sessionsError) throw sessionsError;

      if (!sessions || sessions.length === 0) {
        // Nenhuma sessão encontrada, zerar streak
        await supabase
          .from("profiles")
          .update({
            current_streak: 0,
            longest_streak: 0,
            last_activity_date: null,
          })
          .eq("user_id", user.id);

        toast({
          title: "Sequência recalculada",
          description: "Nenhuma sessão de leitura encontrada.",
        });
        return;
      }

      // Agrupar sessões por data (para casos onde há múltiplas sessões no mesmo dia)
      const uniqueDates = Array.from(
        new Set(sessions.map(session => new Date(session.session_date).toISOString().split("T")[0]))
      ).sort();

      // Calcular sequências
      let currentStreak = 0;
      let longestStreak = 0;
      let streakCount = 0;

      // Começar do final (mais recente) para calcular sequência atual
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      // Verificar se leu hoje
      let lastReadDate = uniqueDates[uniqueDates.length - 1];
      let currentDate = new Date(lastReadDate);

      // Calcular sequência atual (contando de trás para frente)
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

      // A sequência atual só conta se a última leitura foi ontem ou hoje
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      if (lastReadDate === todayStr || lastReadDate === yesterdayStr) {
        currentStreak = streakCount;
      } else {
        currentStreak = 0; // Quebrou a sequência
      }

      // Calcular maior sequência histórica
      streakCount = 1;
      longestStreak = 1;

      for (let i = 1; i < uniqueDates.length; i++) {
        const currentDateCheck = new Date(uniqueDates[i]);
        const prevDateCheck = new Date(uniqueDates[i - 1]);
        prevDateCheck.setDate(prevDateCheck.getDate() + 1);

        if (
          currentDateCheck.toISOString().split("T")[0] === prevDateCheck.toISOString().split("T")[0]
        ) {
          streakCount++;
        } else {
          longestStreak = Math.max(longestStreak, streakCount);
          streakCount = 1;
        }
      }
      longestStreak = Math.max(longestStreak, streakCount);
      longestStreak = Math.max(longestStreak, currentStreak);

      // Atualizar no banco
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_activity_date: lastReadDate,
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

      toast({
        title: "✅ Sequência recalculada!",
        description: `Sequência atual: ${currentStreak} dias | Melhor: ${longestStreak} dias`,
      });
    } catch (error) {
      console.error("Error recalculating streak:", error);
      toast({
        title: "Erro",
        description: "Não foi possível recalcular a sequência.",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Recalcular Sequência
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Use este botão se sua sequência não estiver correta. Ele vai analisar todo o seu histórico
          de leitura e recalcular corretamente.
        </p>
        <Button onClick={recalculateStreak} disabled={isRecalculating} className="w-full">
          {isRecalculating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Recalculando...
            </>
          ) : (
            <>
              <Calculator className="h-4 w-4 mr-2" />
              Recalcular Sequência
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
