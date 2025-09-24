import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy, Wand2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export const TestAchievements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const unlockFirstBookAchievement = async () => {
    if (!user?.id) return;

    try {
      // Get the "Primeiro Livro" achievement
      const { data: achievement } = await supabase
        .from("achievements")
        .select("id")
        .eq("title", "Primeiro Livro")
        .single();

      if (!achievement) {
        toast({
          title: "Erro",
          description: "Conquista não encontrada",
          variant: "destructive",
        });
        return;
      }

      // Unlock the achievement for the user
      const { error } = await supabase
        .from("user_achievements")
        .insert({
          user_id: user.id,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString(),
        });

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          toast({
            title: "Já desbloqueado!",
            description: "Você já possui esta conquista.",
          });
        } else {
          console.error(
            "Error unlocking achievement:",
            error
          );
          toast({
            title: "Erro",
            description:
              "Não foi possível desbloquear a conquista",
            variant: "destructive",
          });
        }
        return;
      }

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: ["achievements"],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-achievements"],
      });
      queryClient.invalidateQueries({
        queryKey: ["achievements-progress"],
      });
      queryClient.invalidateQueries({
        queryKey: ["activity-feed"],
      });

      toast({
        title: "🏆 Conquista desbloqueada!",
        description: "Você desbloqueou 'Primeiro Livro'!",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description: "Algo deu errado",
        variant: "destructive",
      });
    }
  };

  const addTestBook = async () => {
    if (!user?.id) return;

    try {
      // Add a completed test book
      const { error } = await supabase
        .from("books")
        .insert({
          user_id: user.id,
          title: "O Livro de Teste",
          author: "Autor de Teste",
          total_pages: 200,
          pages_read: 200,
          status: "completed",
          date_completed: new Date().toISOString(),
        });

      if (error) {
        console.error("Error adding test book:", error);
        toast({
          title: "Erro",
          description:
            "Não foi possível adicionar o livro de teste",
          variant: "destructive",
        });
        return;
      }

      // Update profile stats
      const { data: profile } = await supabase
        .from("profiles")
        .select("books_completed, total_pages_read")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        await supabase
          .from("profiles")
          .update({
            books_completed:
              (profile.books_completed || 0) + 1,
            total_pages_read:
              (profile.total_pages_read || 0) + 200,
          })
          .eq("user_id", user.id);
      }

      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({
        queryKey: ["books"],
      });
      queryClient.invalidateQueries({
        queryKey: ["profile"],
      });
      queryClient.invalidateQueries({
        queryKey: ["activity-feed"],
      });

      toast({
        title: "📚 Livro adicionado!",
        description: "Livro de teste criado com sucesso!",
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description: "Algo deu errado",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <Card className="mb-6 border-dashed border-2 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <Wand2 className="h-5 w-5" />
          Área de Teste
        </CardTitle>
        <CardDescription className="text-orange-600">
          Use estes botões para testar o sistema de
          conquistas e feed de atividades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={unlockFirstBookAchievement}
          variant="outline"
          className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
        >
          <Trophy className="h-4 w-4 mr-2" />
          Desbloquear "Primeiro Livro"
        </Button>

        <Button
          onClick={addTestBook}
          variant="outline"
          className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
        >
          📚 Adicionar Livro de Teste Completo
        </Button>
      </CardContent>
    </Card>
  );
};
