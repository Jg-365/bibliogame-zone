import { useEffect } from "react";
import { useAchievements } from "@/hooks/useAchievements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export const AchievementsDiagnostic = () => {
  const { achievements, isLoading, unlockedCount, totalCount } = useAchievements();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAchievements = async () => {
      console.log("🔍 Diagnóstico de Conquistas:");

      // 1. Verificar se existem conquistas na tabela
      const { data: allAchievements, error: achievementsError } = await supabase
        .from("achievements")
        .select("*");

      console.log("📊 Total de conquistas no banco:", allAchievements?.length || 0);
      if (achievementsError) {
        console.error("❌ Erro ao buscar conquistas:", achievementsError);
      } else {
        console.log("✅ Conquistas encontradas:", allAchievements);
      }

      // 2. Verificar conquistas do usuário
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: userAchievements, error: userError } = await supabase
          .from("user_achievements")
          .select("*")
          .eq("user_id", user.id);

        console.log("🎯 Conquistas desbloqueadas:", userAchievements?.length || 0);
        if (userError) {
          console.error("❌ Erro ao buscar conquistas do usuário:", userError);
        } else {
          console.log("✅ User achievements:", userAchievements);
        }
      }

      // 3. Verificar hook
      console.log("🎣 Hook useAchievements retornou:", {
        achievements,
        isLoading,
        unlockedCount,
        totalCount,
        length: achievements?.length,
      });
    };

    checkAchievements();
  }, [achievements, isLoading, unlockedCount, totalCount]);

  return (
    <Card className="border-2 border-blue-500">
      <CardHeader>
        <CardTitle className="text-blue-600">🔍 Diagnóstico de Conquistas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p>
            <strong>Status:</strong> {isLoading ? "Carregando..." : "Carregado"}
          </p>
          <p>
            <strong>Total de conquistas:</strong> {totalCount}
          </p>
          <p>
            <strong>Desbloqueadas:</strong> {unlockedCount}
          </p>
          <p>
            <strong>Array length:</strong> {achievements?.length || 0}
          </p>
        </div>

        {achievements && achievements.length > 0 && (
          <div className="space-y-2">
            <p className="font-semibold">Conquistas carregadas ({achievements.length}):</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {achievements.slice(0, 8).map(a => (
                <li
                  key={a.id}
                  className={a.unlocked ? "text-green-700 font-medium" : "text-gray-500"}
                >
                  {a.icon} {a.title} - {a.unlocked ? "✅ Desbloqueada" : "🔒 Bloqueada"}
                  {a.unlocked && a.unlockedAt && (
                    <span className="text-xs ml-2">
                      ({new Date(a.unlockedAt).toLocaleDateString()})
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {achievements.filter(a => a.unlocked).length > 0 && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-sm font-semibold text-green-800">
                  ✅ {achievements.filter(a => a.unlocked).length} conquistas desbloqueadas
                  encontradas!
                </p>
              </div>
            )}
          </div>
        )}

        {achievements && achievements.length === 0 && !isLoading && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm font-semibold text-red-800">⚠️ O hook retornou um array vazio!</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={async () => {
              const { data, error } = await supabase.from("achievements").select("count");
              alert(`Conquistas no banco: ${data?.[0]?.count || 0}`);
              if (error) console.error(error);
            }}
          >
            Verificar Banco
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["achievements"] });
              queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
              queryClient.invalidateQueries({ queryKey: ["achievements-progress"] });
              console.log("🔄 Queries invalidadas!");
            }}
          >
            🔄 Recarregar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
