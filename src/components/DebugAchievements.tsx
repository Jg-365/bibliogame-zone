import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export const DebugAchievements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const clearInvalidAchievements = async () => {
    if (!user?.id) return;

    try {
      // Clear ALL user achievements to start fresh
      const { error: deleteError } = await supabase
        .from("user_achievements")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) {
        console.error("Error deleting achievements:", deleteError);
        toast({
          title: "Erro",
          description: "Não foi possível limpar as conquistas",
          variant: "destructive",
        });
        return;
      }

      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: ["achievements"],
      });
      queryClient.invalidateQueries({
        queryKey: ["activity-feed"],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-achievements"],
      });

      toast({
        title: "✅ Conquistas limpas!",
        description: "Todas as conquistas foram removidas. O feed deve estar limpo agora.",
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

  const debugUserData = async () => {
    if (!user?.id) return;

    try {
      // Check user profile stats
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      console.log("User profile stats:", profile);

      // Check user books
      const { data: books } = await supabase.from("books").select("*").eq("user_id", user.id);

      console.log("User books:", books);

      // Check user achievements
      const { data: achievements } = await supabase
        .from("user_achievements")
        .select(
          `
          *,
          achievements(*)
        `
        )
        .eq("user_id", user.id);

      console.log("User achievements:", achievements);

      toast({
        title: "Debug info logged",
        description: "Check the browser console for details",
      });
    } catch (error) {
      console.error("Debug error:", error);
    }
  };

  if (!user) return null;

  return (
    <Card className="mb-6 border-dashed border-2 border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <RefreshCw className="h-5 w-5" />
          Debug Conquistas
        </CardTitle>
        <CardDescription className="text-red-600">
          Ferramentas para debugar o problema das conquistas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={debugUserData}
          variant="outline"
          className="w-full border-red-300 text-red-700 hover:bg-red-100"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Log Debug Info
        </Button>

        <Button
          onClick={clearInvalidAchievements}
          variant="outline"
          className="w-full border-red-300 text-red-700 hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Limpar Todas as Conquistas
        </Button>
      </CardContent>
    </Card>
  );
};
