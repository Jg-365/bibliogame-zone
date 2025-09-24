import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  total_pages: number;
  pages_read: number;
  status: "want-to-read" | "reading" | "completed";
  cover_url: string | null;
  google_books_id: string | null;
  date_added: string;
  date_completed: string | null;
  created_at: string;
  updated_at: string;
}

export const useBooks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
    mutationFn: async (bookData: Omit<Book, "id" | "user_id" | "created_at" | "updated_at" | "date_added">) => {
      if (!user?.id) throw new Error("User not authenticated");

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
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
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Book> }) => {
      const { data, error } = await supabase
        .from("books")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user?.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
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
      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
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

  return {
    books,
    isLoading,
    addBook: addBook.mutate,
    updateBook: updateBook.mutate,
    deleteBook: deleteBook.mutate,
    isAddingBook: addBook.isPending,
    isUpdatingBook: updateBook.isPending,
  };
};