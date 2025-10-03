import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { useCheckAchievements } from "./useAchievements";
import type { Book, GoogleBook, ReadingSession } from "@/types/reading";

// Google Books API integration
export const searchGoogleBooks = async (query: string): Promise<GoogleBook[]> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`
    );
    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error("Error searching Google Books:", error);
    return [];
  }
};

export const useBooks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const checkAchievements = useCheckAchievements();

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching books:", error);
        return [];
      }

      return data as Book[];
    },
    enabled: !!user?.id,
  });

  const addBook = useMutation({
    mutationFn: async (bookData: {
      title: string;
      author: string;
      total_pages: number;
      status?: "want-to-read" | "reading" | "completed";
      cover_url?: string;
      google_books_id?: string;
      isbn?: string;
      description?: string;
      published_date?: string;
      genres?: string[];
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("books")
        .insert({
          user_id: user.id,
          title: bookData.title,
          author: bookData.author,
          total_pages: bookData.total_pages,
          pages_read: 0,
          status: bookData.status || "want-to-read",
          cover_url: bookData.cover_url,
          google_books_id: bookData.google_books_id,
          isbn: bookData.isbn,
          description: bookData.description,
          published_date: bookData.published_date,
          genres: bookData.genres,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["books", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["profile", user?.id],
      });
      toast({
        title: "Livro adicionado!",
        description: "O livro foi adicionado à sua biblioteca.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar livro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBook = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await (supabase as any)
        .from("books")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async updatedBook => {
      queryClient.invalidateQueries({
        queryKey: ["books", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["profile", user?.id],
      });

      // Check for new achievements when a book is completed
      if (updatedBook.status === "completed") {
        try {
          // Get current user stats - use default values since columns don't exist yet
          await checkAchievements.mutateAsync({
            booksCompleted: 0,
            totalPagesRead: 0,
            readingStreak: 0,
          });
        } catch (error) {
          console.error("Error checking achievements:", error);
        }
      }

      toast({
        title: "Livro atualizado!",
        description: "O progresso foi salvo com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar livro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteBook = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase.from("books").delete().eq("id", id).eq("user_id", user.id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["books", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["profile", user?.id],
      });
      toast({
        title: "Livro removido!",
        description: "O livro foi removido da sua biblioteca.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover livro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addReadingSession = useMutation({
    mutationFn: async (sessionData: {
      book_id: string;
      pages_read: number;
      notes?: string;
      session_date?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // First, get the current book data
      const { data: book, error: bookError } = await supabase
        .from("books")
        .select("pages_read, total_pages")
        .eq("id", sessionData.book_id)
        .eq("user_id", user.id)
        .single();

      if (bookError) throw bookError;

      // Add the reading session
      const { data, error } = await supabase
        .from("reading_sessions")
        .insert({
          user_id: user.id,
          book_id: sessionData.book_id,
          pages_read: sessionData.pages_read,
          notes: sessionData.notes,
          session_date: sessionData.session_date || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update the book's total pages read
      const newPagesRead = (book.pages_read || 0) + sessionData.pages_read;
      const status =
        newPagesRead >= book.total_pages
          ? "completed"
          : newPagesRead > 0
          ? "reading"
          : "want-to-read";

      const { error: updateError } = await supabase
        .from("books")
        .update({
          pages_read: newPagesRead,
          status: status,
        })
        .eq("id", sessionData.book_id)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["books", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["reading-sessions", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["today-sessions", user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["profile", user?.id],
      });
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

  const searchBooks = useQuery({
    queryKey: ["google-books-search"],
    queryFn: () => [],
    enabled: false, // Only run when manually triggered
  });

  return {
    books,
    isLoading,
    addBook: addBook.mutate,
    updateBook: updateBook.mutate,
    deleteBook: deleteBook.mutate,
    addReadingSession: addReadingSession.mutate,
    searchGoogleBooks: searchGoogleBooks,
    isAddingBook: addBook.isPending,
    isUpdatingBook: updateBook.isPending,
    isAddingSession: addReadingSession.isPending,
  };
};
