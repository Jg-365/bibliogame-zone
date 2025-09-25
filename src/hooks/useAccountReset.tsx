import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

export const useAccountReset = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const resetAccount = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const userId = user.id;

      // Reset user profile stats - TUDO limpo
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          current_streak: 0,
          longest_streak: 0,
          books_completed: 0,
          total_pages_read: 0,
          level: "Iniciante",
          points: 0,
          experience_points: 0,
          current_book_id: null,
          last_activity_date: null,
          updated_at: new Date().toISOString(),
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

  const deleteAccountCompletely = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      const userId = user.id;
      const userEmail = user.email;

      try {
        // Delete all data manually with proper error handling
        console.log(
          "🗑️ Iniciando exclusão completa da conta..."
        );

        // 1. Delete all reading sessions first (has foreign key to books)
        const { error: sessionsError } = await supabase
          .from("reading_sessions")
          .delete()
          .eq("user_id", userId);

        if (sessionsError) {
          console.error(
            "Erro ao deletar sessões:",
            sessionsError
          );
        } else {
          console.log("✅ Sessões de leitura removidas");
        }

        // 2. Delete all user achievements
        const { error: achievementsError } = await supabase
          .from("user_achievements")
          .delete()
          .eq("user_id", userId);

        if (achievementsError) {
          console.error(
            "Erro ao deletar conquistas:",
            achievementsError
          );
        } else {
          console.log("✅ Conquistas removidas");
        }

        // 3. Delete all user books
        const { error: booksError } = await supabase
          .from("books")
          .delete()
          .eq("user_id", userId);

        if (booksError) {
          console.error(
            "Erro ao deletar livros:",
            booksError
          );
        } else {
          console.log("✅ Livros removidos");
        }

        // 4. Delete all follows (both directions)
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
        } else {
          console.log(
            "✅ Relacionamentos sociais removidos"
          );
        }

        // 5. Delete the user profile
        const { error: profileError } = await supabase
          .from("profiles")
          .delete()
          .eq("user_id", userId);

        if (profileError) {
          console.error(
            "Erro ao deletar perfil:",
            profileError
          );
        } else {
          console.log("✅ Perfil removido");
        }

        // 6. CRITICAL: Sign out from ALL devices and sessions
        console.log("🚪 Fazendo logout global...");
        await supabase.auth.signOut({ scope: "global" });

        // 7. Additional step: clear all local storage and session storage
        if (typeof window !== "undefined") {
          console.log("🧹 Limpando dados locais...");
          localStorage.clear();
          sessionStorage.clear();

          // Clear any cookies related to Supabase
          document.cookie.split(";").forEach((c) => {
            const eqPos = c.indexOf("=");
            const name =
              eqPos > -1 ? c.substr(0, eqPos) : c;
            const cleanName = name.trim();
            if (
              cleanName.includes("supabase") ||
              cleanName.includes("auth") ||
              cleanName.includes("sb-")
            ) {
              document.cookie =
                cleanName +
                "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
              document.cookie =
                cleanName +
                "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" +
                window.location.hostname;
            }
          });
        }

        console.log(
          `✅ Conta do usuário ${userEmail} foi completamente removida!`
        );
        return true;
      } catch (error) {
        console.error(
          "Erro durante exclusão da conta:",
          error
        );

        // Even if there are errors, still sign out and clear data
        console.log(
          "⚠️ Houve erros, mas fazendo limpeza de segurança..."
        );
        await supabase.auth.signOut({ scope: "global" });
        if (typeof window !== "undefined") {
          localStorage.clear();
          sessionStorage.clear();
        }

        throw new Error(
          "Dados removidos com alguns erros. Você foi deslogado com segurança."
        );
      }
    },
    onSuccess: () => {
      // Clear all cached data immediately
      queryClient.clear();

      toast({
        title: "✅ Conta excluída completamente!",
        description:
          "Todos os seus dados foram removidos permanentemente. Redirecionando...",
      });

      // Immediate redirect since user is already signed out
      setTimeout(() => {
        window.location.replace("/");
      }, 1500);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir conta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    resetAccount: resetAllData,
    deleteAccountCompletely,
    isResetting:
      resetAllData.isPending ||
      resetAccount.isPending ||
      deleteAccountCompletely.isPending,
  };
};
