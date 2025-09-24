import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export const useAccountReset = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const resetAccount = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const userId = user.id;

      // Reset user profile stats
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          current_streak: 0,
          books_completed: 0,
          experience_points: 0,
          total_pages_read: 0,
        })
        .eq("user_id", userId);

      if (profileError) {
        console.error(
          "Erro ao resetar perfil:",
          profileError
        );
        throw new Error("Erro ao resetar dados do perfil");
      }

      // Delete all user books
      const { error: booksError } = await supabase
        .from("books")
        .delete()
        .eq("user_id", userId);

      if (booksError) {
        console.error(
          "Erro ao deletar livros:",
          booksError
        );
        throw new Error("Erro ao deletar livros");
      }

      // Delete all user achievements
      const { error: achievementsError } = await supabase
        .from("user_achievements")
        .delete()
        .eq("user_id", userId);

      if (achievementsError) {
        console.error(
          "Erro ao deletar conquistas:",
          achievementsError
        );
        throw new Error("Erro ao deletar conquistas");
      }

      // Delete all reading sessions
      const { error: sessionsError } = await supabase
        .from("reading_sessions")
        .delete()
        .eq("user_id", userId);

      if (sessionsError) {
        console.error(
          "Erro ao deletar sessões:",
          sessionsError
        );
        throw new Error(
          "Erro ao deletar sessões de leitura"
        );
      }

      // Note: Activities are generated dynamically from books and achievements
      // No need to delete from a separate activities table

      // Delete all follows (following and followers)
      const { error: followsError1 } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", userId);

      if (followsError1) {
        console.error(
          "Erro ao deletar seguidores:",
          followsError1
        );
      }

      const { error: followsError2 } = await supabase
        .from("follows")
        .delete()
        .eq("following_id", userId);

      if (followsError2) {
        console.error(
          "Erro ao deletar seguindo:",
          followsError2
        );
      }

      return true;
    },
    onSuccess: () => {
      toast({
        title: "Conta resetada com sucesso!",
        description:
          "Todos os seus dados foram removidos. Você pode começar novamente.",
      });

      // Force clear all cached data and refetch
      queryClient.clear();

      // Specifically invalidate important queries
      queryClient.invalidateQueries({
        queryKey: ["books"],
      });
      queryClient.invalidateQueries({
        queryKey: ["profile"],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-achievements"],
      });
      queryClient.invalidateQueries({
        queryKey: ["achievements"],
      });
      queryClient.invalidateQueries({
        queryKey: ["reading-sessions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["today-sessions"],
      });
      queryClient.invalidateQueries({
        queryKey: ["leaderboard"],
      });
      queryClient.invalidateQueries({
        queryKey: ["activity"],
      });
      queryClient.invalidateQueries({
        queryKey: ["follows"],
      });

      // Force refetch user profile
      if (user?.id) {
        queryClient.refetchQueries({
          queryKey: ["profile", user.id],
        });
        queryClient.refetchQueries({
          queryKey: ["books", user.id],
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao resetar conta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetAllData = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      // Show confirmation dialog
      const confirmed = window.confirm(
        "⚠️ ATENÇÃO: Esta ação irá deletar TODOS os seus dados permanentemente!\n\n" +
          "Isso inclui:\n" +
          "• Todos os livros adicionados\n" +
          "• Todas as conquistas obtidas\n" +
          "• Todo o progresso de leitura\n" +
          "• Todas as sessões de leitura\n" +
          "• Todos os seguidores e pessoas que você segue\n" +
          "• Sequências de leitura\n" +
          "• Estatísticas gerais\n\n" +
          "Esta ação NÃO PODE SER DESFEITA!\n\n" +
          "Tem certeza que deseja continuar?"
      );

      if (!confirmed) {
        throw new Error("Operação cancelada pelo usuário");
      }

      // Second confirmation
      const doubleConfirmed = window.confirm(
        "🚨 ÚLTIMA CONFIRMAÇÃO 🚨\n\n" +
          "Você tem ABSOLUTA CERTEZA que deseja deletar TODOS os seus dados?\n\n" +
          "Digite 'RESETAR' na próxima caixa de diálogo para confirmar."
      );

      if (!doubleConfirmed) {
        throw new Error("Operação cancelada pelo usuário");
      }

      const confirmationText = window.prompt(
        "Digite 'RESETAR' (em maiúsculas) para confirmar a exclusão de todos os dados:"
      );

      if (confirmationText !== "RESETAR") {
        throw new Error(
          "Confirmação inválida. Operação cancelada."
        );
      }

      return resetAccount.mutateAsync();
    },
    onSuccess: () => {
      toast({
        title: "🎉 Conta resetada!",
        description:
          "Bem-vindo de volta! Comece sua jornada de leitura novamente.",
      });
    },
    onError: (error: Error) => {
      if (error.message.includes("cancelada")) {
        toast({
          title: "Operação cancelada",
          description: "Seus dados estão seguros.",
        });
      } else {
        toast({
          title: "Erro ao resetar conta",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  return {
    resetAccount: resetAllData,
    isResetting:
      resetAllData.isPending || resetAccount.isPending,
  };
};
