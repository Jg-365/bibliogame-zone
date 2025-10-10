import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export type Profile =
  Database["public"]["Tables"]["profiles"]["Row"];

// Define allowed update fields (excluding system fields)
interface ProfileUpdateFields {
  username?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  preferred_genres?: string[] | null;
  points?: number;
  level?: string;
  books_completed?: number;
  total_pages_read?: number;
  current_streak?: number;
  longest_streak?: number;
  is_private?: boolean;
  theme?: "light" | "dark";
  notifications_enabled?: boolean;
  current_book_id?: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const forceRefresh = () => {
    console.log("🔄 Forçando refresh do perfil");
    queryClient.invalidateQueries({
      queryKey: ["profile", user?.id],
    });
    queryClient.refetchQueries({
      queryKey: ["profile", user?.id],
    });
  };

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: ProfileUpdateFields) => {
      if (!user?.id)
        throw new Error("Usuário não autenticado");

      console.log("🔄 Atualizando perfil:", {
        userId: user.id,
        updates,
      });

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error(
          "❌ Erro ao atualizar perfil:",
          error
        );
        throw new Error(
          `Erro no banco de dados: ${error.message}`
        );
      }

      console.log(
        "✅ Perfil atualizado com sucesso:",
        data
      );
      return data;
    },
    onSuccess: (data) => {
      console.log(
        "🎉 Sucesso na mutação, invalidando cache"
      );

      // Invalidar múltiplas queries relacionadas
      queryClient.invalidateQueries({
        queryKey: ["profile"],
      });

      // Forçar refetch imediato
      queryClient.refetchQueries({
        queryKey: ["profile", user?.id],
      });

      // Limpar cache antigo e definir novo
      queryClient.setQueryData(["profile", user?.id], data);

      toast({
        title: "Perfil atualizado!",
        description:
          "Suas informações foram salvas com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error("💥 Erro na mutação:", error);
      toast({
        title: "Erro ao atualizar perfil",
        description:
          error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    },
  });

  // Recompute profile stats from reading_sessions (pages read) and books
  const recomputeFromSessions = async () => {
    if (!user?.id)
      throw new Error("Usuário não autenticado");
    // 1) Load all sessions grouped by book
    const { data: sessionsData, error: sessionsError } =
      await supabase
        .from("reading_sessions")
        .select("book_id, pages_read")
        .eq("user_id", user.id);

    if (sessionsError) throw sessionsError;

    // Sum pages per book
    const pagesPerBook = (sessionsData || []).reduce(
      (acc: Record<string, number>, s: any) => {
        if (!s || !s.book_id) return acc;
        acc[s.book_id] =
          (acc[s.book_id] || 0) + (s.pages_read || 0);
        return acc;
      },
      {}
    );

    const bookIds = Object.keys(pagesPerBook);

    // 2) Fetch affected books to get total_pages and validate ownership
    let booksData: any[] = [];
    if (bookIds.length > 0) {
      const { data: bd, error: bErr } = await supabase
        .from("books")
        .select("id, total_pages")
        .in("id", bookIds)
        .eq("user_id", user.id);

      if (bErr) throw bErr;
      booksData = bd || [];
    }

    // 3) Update each book.pages_read to match sessions sum and adjust status
    let totalPages = 0;
    let completedCount = 0;

    for (const b of booksData) {
      const newPages = Math.max(0, pagesPerBook[b.id] || 0);
      totalPages += newPages;

      const status =
        newPages >= (b.total_pages || 0)
          ? "completed"
          : newPages > 0
          ? "reading"
          : "want-to-read";

      // Update the book record to match sessions
      const { error: updErr } = await supabase
        .from("books")
        .update({ pages_read: newPages, status })
        .eq("id", b.id)
        .eq("user_id", user.id);

      if (updErr) {
        console.error(
          "Erro atualizando livro durante recalculo:",
          updErr
        );
        // continue with others
      }

      if (status === "completed") completedCount++;
    }

    // 4) If there are sessions for books not present in user's books table, include their pages
    const orphanBookPages = Object.entries(
      pagesPerBook
    ).reduce((sum, [bookId, pages]) => {
      if (booksData.find((b) => b.id === bookId))
        return sum;
      return sum + (pages || 0);
    }, 0);

    totalPages += orphanBookPages;

    // 5) Update profile totals
    const { data, error } = await supabase
      .from("profiles")
      .update({
        total_pages_read: totalPages,
        books_completed: completedCount,
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    // Refresh cache
    queryClient.invalidateQueries({
      queryKey: ["profile", user.id],
    });
    queryClient.refetchQueries({
      queryKey: ["profile", user.id],
    });
    queryClient.setQueryData(["profile", user.id], data);

    toast({
      title: "Estatísticas recalculadas",
      description:
        "Os dados do perfil foram atualizados a partir das sessões de leitura.",
    });

    return data;
  };

  return {
    profile,
    isLoading,
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
    forceRefresh,
    recomputeFromSessions,
  };
};
