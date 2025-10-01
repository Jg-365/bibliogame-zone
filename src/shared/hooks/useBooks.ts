import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "./useToast";
import {
  getErrorMessage,
  useErrorHandler,
  createValidationError,
} from "@/shared/utils/errorHandling";
import { QUERY_KEYS } from "@/shared/types";
import {
  addBookSchema,
  updateBookSchema,
  updateReadingProgressSchema,
} from "@/shared/schemas";
import type { Book, ReadingStatus } from "@/shared/types";
import type {
  AddBookFormData,
  UpdateBookFormData,
  UpdateReadingProgressFormData,
} from "@/shared/schemas";
import type { Database } from "@/integrations/supabase/types";

/**
 * Optimized hook for books management with intelligent caching and error handling
 */
export const useBooks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's books with optimized query
  const {
    data: books = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.books(user?.id || ""),
    queryFn: async (): Promise<Book[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as Book[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Add book mutation
  const addBookMutation = useMutation({
    mutationFn: async (
      bookData: Omit<
        Book,
        "id" | "user_id" | "created_at" | "updated_at"
      >
    ) => {
      if (!user?.id)
        throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("books")
        .insert({
          ...bookData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newBook) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        QUERY_KEYS.books(user?.id || ""),
        (oldBooks: Book[] = []) => [newBook, ...oldBooks]
      );

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.stats(user?.id || ""),
      });

      toast({
        title: "Livro adicionado!",
        description: `"${newBook.title}" foi adicionado à sua biblioteca.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar livro",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  // Update book mutation
  const updateBookMutation = useMutation({
    mutationFn: async ({
      bookId,
      updates,
    }: {
      bookId: string;
      updates: Partial<Book>;
    }) => {
      const { data, error } = await supabase
        .from("books")
        .update(updates)
        .eq("id", bookId)
        .eq("user_id", user?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (updatedBook) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        QUERY_KEYS.books(user?.id || ""),
        (oldBooks: Book[] = []) =>
          oldBooks.map((book) =>
            book.id === updatedBook.id ? updatedBook : book
          )
      );

      // Invalidate related queries if status changed
      if (
        updatedBook.status === "lido" ||
        updatedBook.status === "completed"
      ) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.stats(user?.id || ""),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.achievements(user?.id || ""),
        });
      }

      toast({
        title: "Livro atualizado!",
        description: `"${updatedBook.title}" foi atualizado.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar livro",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  // Delete book mutation
  const deleteBookMutation = useMutation({
    mutationFn: async (bookId: string) => {
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", bookId)
        .eq("user_id", user?.id);

      if (error) throw error;
      return bookId;
    },
    onSuccess: (deletedBookId) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        QUERY_KEYS.books(user?.id || ""),
        (oldBooks: Book[] = []) =>
          oldBooks.filter(
            (book) => book.id !== deletedBookId
          )
      );

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.stats(user?.id || ""),
      });

      toast({
        title: "Livro removido",
        description:
          "O livro foi removido da sua biblioteca.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover livro",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    },
  });

  // Update reading progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({
      bookId,
      pagesRead,
    }: {
      bookId: string;
      pagesRead: number;
    }) => {
      const book = books.find((b) => b.id === bookId);
      if (!book) throw new Error("Book not found");

      const updates: Partial<Book> = {
        pages_read: pagesRead,
      };

      // Auto-complete if all pages are read
      if (
        pagesRead >= book.total_pages &&
        book.status !== "lido" &&
        book.status !== "completed"
      ) {
        updates.status = "lido" as ReadingStatus;
        updates.date_completed = new Date().toISOString();
      }

      return updateBookMutation.mutateAsync({
        bookId,
        updates,
      });
    },
  });

  // Computed values
  const booksByStatus = {
    reading: books.filter(
      (book) =>
        book.status === "lendo" || book.status === "reading"
    ),
    completed: books.filter(
      (book) =>
        book.status === "lido" ||
        book.status === "completed"
    ),
    wantToRead: books.filter(
      (book) =>
        book.status === "não lido" ||
        book.status === "want-to-read"
    ),
    abandoned: books.filter(
      (book) => book.status === "abandonado"
    ),
  };

  const stats = {
    total: books.length,
    completed: booksByStatus.completed.length,
    reading: booksByStatus.reading.length,
    wantToRead: booksByStatus.wantToRead.length,
    abandoned: booksByStatus.abandoned.length,
    completedThisYear: booksByStatus.completed.filter(
      (book) => {
        const date = book.date_completed || book.updated_at;
        return (
          new Date(date).getFullYear() ===
          new Date().getFullYear()
        );
      }
    ).length,
  };

  return {
    // Data
    books,
    booksByStatus,
    stats,

    // Loading states
    isLoading,
    isAddingBook: addBookMutation.isPending,
    isUpdatingBook: updateBookMutation.isPending,
    isDeletingBook: deleteBookMutation.isPending,
    isUpdatingProgress: updateProgressMutation.isPending,

    // Error states
    error,

    // Actions
    addBook: addBookMutation.mutate,
    updateBook: updateBookMutation.mutate,
    deleteBook: deleteBookMutation.mutate,
    updateProgress: updateProgressMutation.mutate,

    // Async actions
    addBookAsync: addBookMutation.mutateAsync,
    updateBookAsync: updateBookMutation.mutateAsync,
    deleteBookAsync: deleteBookMutation.mutateAsync,
    updateProgressAsync: updateProgressMutation.mutateAsync,
  };
};
