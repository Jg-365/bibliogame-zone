import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { useCheckAchievements } from "./useAchievements";
import { useStreakUpdate } from "./useStreakUpdate";

export interface ReadingSession {
  id: string;
  book_id: string;
  user_id: string;
  pages_read: number;
  notes?: string;
  session_date: string;
  created_at: string;
  book?: {
    title: string;
    author: string;
    cover_url?: string;
  };
}

export const useReadingSessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const checkAchievements = useCheckAchievements();
  const { checkStreakUpdate } = useStreakUpdate();

  // Get all reading sessions for the user
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["reading-sessions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("reading_sessions")
        .select(
          `
          id,
          book_id,
          user_id,
          pages_read,
          notes,
          session_date,
          created_at,
          book:books(
            title,
            author,
            cover_url
          )
        `
        )
        .eq("user_id", user.id)
        .order("session_date", { ascending: false });

      if (error) {
        console.error(
          "Error fetching reading sessions:",
          error
        );
        return [];
      }

      return data as ReadingSession[];
    },
    enabled: !!user?.id,
  });

  // Get today's reading sessions
  const { data: todaySessions = [] } = useQuery({
    queryKey: ["today-sessions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("reading_sessions")
        .select(
          `
          id,
          book_id,
          user_id,
          pages_read,
          notes,
          session_date,
          created_at,
          book:books(
            title,
            author,
            cover_url
          )
        `
        )
        .eq("user_id", user.id)
        .gte("session_date", `${today}T00:00:00Z`)
        .lt("session_date", `${today}T23:59:59Z`)
        .order("session_date", { ascending: false });

      if (error) {
        console.error(
          "Error fetching today's sessions:",
          error
        );
        return [];
      }

      return data as ReadingSession[];
    },
    enabled: !!user?.id,
  });

  // Add a new reading session
  const addReadingSession = useMutation({
    mutationFn: async (sessionData: {
      book_id: string;
      pages_read: number;
      notes?: string;
      session_date?: string;
    }) => {
      if (!user?.id)
        throw new Error("User not authenticated");

      // Prevent negative or zero pages
      if (sessionData.pages_read <= 0) {
        throw new Error(
          "Número de páginas deve ser maior que zero"
        );
      }

      // First, get the current book data
      const { data: book, error: bookError } =
        await supabase
          .from("books")
          .select("pages_read, total_pages, status")
          .eq("id", sessionData.book_id)
          .eq("user_id", user.id)
          .single();

      if (bookError) throw bookError;

      // Calculate new total pages read
      const newPagesRead =
        (book.pages_read || 0) + sessionData.pages_read;

      // Prevent reading more pages than the book has
      if (newPagesRead > book.total_pages) {
        throw new Error(
          `Não é possível ler ${
            sessionData.pages_read
          } páginas. Restam apenas ${
            book.total_pages - (book.pages_read || 0)
          } páginas para terminar o livro.`
        );
      }

      // Add the reading session first
      const { data: session, error: sessionError } =
        await supabase
          .from("reading_sessions")
          .insert({
            user_id: user.id,
            book_id: sessionData.book_id,
            pages_read: sessionData.pages_read,
            notes: sessionData.notes,
            session_date:
              sessionData.session_date ||
              new Date().toISOString(),
          })
          .select()
          .single();

      if (sessionError) throw sessionError;

      // Determine new status
      const status =
        newPagesRead >= book.total_pages
          ? "completed"
          : newPagesRead > 0
          ? "reading"
          : "want-to-read";

      // Update the book's total pages read and status
      const { error: updateError } = await supabase
        .from("books")
        .update({
          pages_read: newPagesRead,
          status: status,
        })
        .eq("id", sessionData.book_id)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      return session;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({
        queryKey: ["reading-sessions", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["today-sessions", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["books", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["profile", user?.id],
      });

      // Check for new achievements and update streak after adding a reading session
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profile && !error) {
          await checkAchievements.mutateAsync({
            booksCompleted: profile.books_completed || 0,
            totalPagesRead: profile.total_pages_read || 0,
            readingStreak:
              (profile as any).current_streak || 0,
          });

          // Update streak after reading session
          checkStreakUpdate(true);
        }
      } catch (error) {
        console.error(
          "Error checking achievements:",
          error
        );
      }

      toast({
        title: "Progresso registrado!",
        description: "Sua sessão de leitura foi salva.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar progresso",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove pages from a specific session
  const removePages = useMutation({
    mutationFn: async ({
      sessionId,
      pagesToRemove,
    }: {
      sessionId: string;
      pagesToRemove: number;
    }) => {
      if (!user?.id)
        throw new Error("User not authenticated");

      // Get the session data
      const { data: session, error: sessionError } =
        await supabase
          .from("reading_sessions")
          .select("pages_read, book_id")
          .eq("id", sessionId)
          .eq("user_id", user.id)
          .single();

      if (sessionError) throw sessionError;

      const newPagesRead = Math.max(
        0,
        session.pages_read - pagesToRemove
      );

      // If newPagesRead is 0, delete the session instead of updating
      if (newPagesRead === 0) {
        const { error: deleteError } = await supabase
          .from("reading_sessions")
          .delete()
          .eq("id", sessionId)
          .eq("user_id", user.id);

        if (deleteError) throw deleteError;
      } else {
        // Update the session
        const { error: updateSessionError } = await supabase
          .from("reading_sessions")
          .update({ pages_read: newPagesRead })
          .eq("id", sessionId)
          .eq("user_id", user.id);

        if (updateSessionError) throw updateSessionError;
      }

      // Update the book's total pages read
      const { data: book, error: bookError } =
        await supabase
          .from("books")
          .select("pages_read, total_pages")
          .eq("id", session.book_id)
          .eq("user_id", user.id)
          .single();

      if (bookError) throw bookError;

      const updatedBookPages = Math.max(
        0,
        (book.pages_read || 0) - pagesToRemove
      );
      const status =
        updatedBookPages >= book.total_pages
          ? "completed"
          : updatedBookPages > 0
          ? "reading"
          : "want-to-read";

      const { error: updateBookError } = await supabase
        .from("books")
        .update({
          pages_read: updatedBookPages,
          status: status,
        })
        .eq("id", session.book_id)
        .eq("user_id", user.id);

      if (updateBookError) throw updateBookError;

      return {
        sessionId,
        newPagesRead,
        wasDeleted: newPagesRead === 0,
      };
    },
    onMutate: async ({ sessionId, pagesToRemove }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["reading-sessions", user?.id],
      });
      await queryClient.cancelQueries({
        queryKey: ["today-sessions", user?.id],
      });

      // Snapshot the previous values
      const previousSessions = queryClient.getQueryData([
        "reading-sessions",
        user?.id,
      ]);
      const previousTodaySessions =
        queryClient.getQueryData([
          "today-sessions",
          user?.id,
        ]);

      // Optimistically update to remove or update the session
      queryClient.setQueryData(
        ["reading-sessions", user?.id],
        (old: ReadingSession[] | undefined) => {
          if (!old) return old;
          const sessionIndex = old.findIndex(
            (s) => s.id === sessionId
          );
          if (sessionIndex === -1) return old;

          const session = old[sessionIndex];
          const newPagesRead = Math.max(
            0,
            session.pages_read - pagesToRemove
          );

          if (newPagesRead === 0) {
            // Remove the session completely
            return old.filter((s) => s.id !== sessionId);
          } else {
            // Update the session
            const newSessions = [...old];
            newSessions[sessionIndex] = {
              ...session,
              pages_read: newPagesRead,
            };
            return newSessions;
          }
        }
      );

      queryClient.setQueryData(
        ["today-sessions", user?.id],
        (old: ReadingSession[] | undefined) => {
          if (!old) return old;
          const sessionIndex = old.findIndex(
            (s) => s.id === sessionId
          );
          if (sessionIndex === -1) return old;

          const session = old[sessionIndex];
          const newPagesRead = Math.max(
            0,
            session.pages_read - pagesToRemove
          );

          if (newPagesRead === 0) {
            // Remove the session completely
            return old.filter((s) => s.id !== sessionId);
          } else {
            // Update the session
            const newSessions = [...old];
            newSessions[sessionIndex] = {
              ...session,
              pages_read: newPagesRead,
            };
            return newSessions;
          }
        }
      );

      return { previousSessions, previousTodaySessions };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousSessions) {
        queryClient.setQueryData(
          ["reading-sessions", user?.id],
          context.previousSessions
        );
      }
      if (context?.previousTodaySessions) {
        queryClient.setQueryData(
          ["today-sessions", user?.id],
          context.previousTodaySessions
        );
      }
      toast({
        title: "Erro ao remover páginas",
        description: err.message,
        variant: "destructive",
      });
    },
    onSuccess: (result) => {
      // Force refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ["reading-sessions", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["today-sessions", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["books", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["profile", user?.id],
      });

      toast({
        title: result.wasDeleted
          ? "Sessão removida!"
          : "Páginas removidas!",
        description: result.wasDeleted
          ? "A sessão foi completamente removida."
          : "O progresso foi ajustado com sucesso.",
      });
    },
  });

  // Delete a reading session completely
  const deleteSession = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!user?.id)
        throw new Error("User not authenticated");

      // Get the session data before deleting
      const { data: session, error: sessionError } =
        await supabase
          .from("reading_sessions")
          .select("pages_read, book_id")
          .eq("id", sessionId)
          .eq("user_id", user.id)
          .single();

      if (sessionError) throw sessionError;

      // Delete the session
      const { data: deleted, error: deleteError } =
        await supabase
          .from("reading_sessions")
          .delete()
          .eq("id", sessionId)
          .eq("user_id", user.id)
          .select("pages_read, book_id")
          .single();

      if (deleteError) throw deleteError;

      // Update the book's total pages read
      const { data: book, error: bookError } =
        await supabase
          .from("books")
          .select("pages_read, total_pages")
          .eq("id", session.book_id)
          .eq("user_id", user.id)
          .single();

      if (bookError) throw bookError;

      const updatedBookPages = Math.max(
        0,
        (book.pages_read || 0) - session.pages_read
      );
      const status =
        updatedBookPages >= book.total_pages
          ? "completed"
          : updatedBookPages > 0
          ? "reading"
          : "want-to-read";

      const { error: updateBookError } = await supabase
        .from("books")
        .update({
          pages_read: updatedBookPages,
          status: status,
        })
        .eq("id", session.book_id)
        .eq("user_id", user.id);

      if (updateBookError) throw updateBookError;

      return { sessionId, deleted };
    },
    onMutate: async (sessionId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["reading-sessions", user?.id],
      });
      await queryClient.cancelQueries({
        queryKey: ["today-sessions", user?.id],
      });

      // Snapshot the previous values
      const previousSessions = queryClient.getQueryData([
        "reading-sessions",
        user?.id,
      ]);
      const previousTodaySessions =
        queryClient.getQueryData([
          "today-sessions",
          user?.id,
        ]);

      // Optimistically remove the session
      queryClient.setQueryData(
        ["reading-sessions", user?.id],
        (old: ReadingSession[] | undefined) => {
          return (
            old?.filter(
              (session) => session.id !== sessionId
            ) || []
          );
        }
      );

      queryClient.setQueryData(
        ["today-sessions", user?.id],
        (old: ReadingSession[] | undefined) => {
          return (
            old?.filter(
              (session) => session.id !== sessionId
            ) || []
          );
        }
      );

      return { previousSessions, previousTodaySessions };
    },
    onError: (err, sessionId, context) => {
      // Rollback on error
      if (context?.previousSessions) {
        queryClient.setQueryData(
          ["reading-sessions", user?.id],
          context.previousSessions
        );
      }
      if (context?.previousTodaySessions) {
        queryClient.setQueryData(
          ["today-sessions", user?.id],
          context.previousTodaySessions
        );
      }
      toast({
        title: "Erro ao remover sessão",
        description: err.message,
        variant: "destructive",
      });
    },
    onSuccess: async (result) => {
      // Force refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ["reading-sessions", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["today-sessions", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["books", user?.id],
      });
      // Also decrement profile.total_pages_read by the deleted session pages if possible
      try {
        const pagesRemoved =
          result?.deleted?.pages_read || 0;
        if (pagesRemoved > 0) {
          const { data: profileData, error: profileError } =
            await supabase
              .from("profiles")
              .select("total_pages_read")
              .eq("user_id", user.id)
              .single();

          if (!profileError && profileData) {
            const newTotal = Math.max(
              0,
              (profileData.total_pages_read || 0) -
                pagesRemoved
            );
            await supabase
              .from("profiles")
              .update({ total_pages_read: newTotal })
              .eq("user_id", user.id);
          }
        }
      } catch (e) {
        console.error(
          "Error updating profile pages after delete:",
          e
        );
      }

      queryClient.invalidateQueries({
        queryKey: ["profile", user?.id],
      });

      toast({
        title: "Sessão removida!",
        description:
          "A sessão de leitura foi removida completamente.",
      });
    },
  });

  // Reset all today's activities
  const resetTodayActivities = useMutation({
    mutationFn: async () => {
      if (!user?.id)
        throw new Error("User not authenticated");

      const today = new Date().toISOString().split("T")[0];

      // Get all today's sessions to calculate pages to subtract from books
      const { data: todaySessionsData, error: fetchError } =
        await supabase
          .from("reading_sessions")
          .select("book_id, pages_read")
          .eq("user_id", user.id)
          .gte("session_date", `${today}T00:00:00Z`)
          .lt("session_date", `${today}T23:59:59Z`);

      if (fetchError) throw fetchError;

      // Group by book_id to calculate total pages per book
      const pagesPerBook = todaySessionsData.reduce(
        (acc, session) => {
          acc[session.book_id] =
            (acc[session.book_id] || 0) +
            session.pages_read;
          return acc;
        },
        {} as Record<string, number>
      );

      // Delete all today's sessions
      const { error: deleteError } = await supabase
        .from("reading_sessions")
        .delete()
        .eq("user_id", user.id)
        .gte("session_date", `${today}T00:00:00Z`)
        .lt("session_date", `${today}T23:59:59Z`);

      if (deleteError) throw deleteError;

      // Update each affected book
      for (const [bookId, pagesRead] of Object.entries(
        pagesPerBook
      )) {
        const { data: book, error: bookError } =
          await supabase
            .from("books")
            .select("pages_read, total_pages")
            .eq("id", bookId)
            .eq("user_id", user.id)
            .single();

        if (bookError) continue;

        const updatedBookPages = Math.max(
          0,
          (book.pages_read || 0) - pagesRead
        );
        const status =
          updatedBookPages >= book.total_pages
            ? "completed"
            : updatedBookPages > 0
            ? "reading"
            : "want-to-read";

        await supabase
          .from("books")
          .update({
            pages_read: updatedBookPages,
            status: status,
          })
          .eq("id", bookId)
          .eq("user_id", user.id);
      }

      return { deletedSessions: todaySessionsData.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["reading-sessions", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["today-sessions", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["books", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["profile", user?.id],
      });
      toast({
        title: "Atividades resetadas!",
        description: `${result.deletedSessions} sessão(ões) de hoje foram removidas.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao resetar atividades",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    sessions,
    todaySessions,
    isLoading,
    addReadingSession: addReadingSession.mutate,
    removePages: removePages.mutate,
    deleteSession: deleteSession.mutate,
    resetTodayActivities: resetTodayActivities.mutate,
    isAddingSession: addReadingSession.isPending,
    isRemovingPages: removePages.isPending,
    isDeletingSession: deleteSession.isPending,
    isResettingToday: resetTodayActivities.isPending,
  };
};
