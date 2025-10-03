import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface CustomBookData {
  title: string;
  author: string;
  description?: string;
  pages: number;
  cover_url?: string;
  isbn?: string;
  genre?: string;
  published_year?: number;
}

export const useCustomBooks = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const uploadCoverImage = async (file: File): Promise<string> => {
    if (!user?.id) {
      throw new Error("Usuário não autenticado");
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `book-covers/${fileName}`;

    const { error: uploadError } = await supabase.storage.from("books").upload(filePath, file);

    if (uploadError) {
      throw new Error(`Erro ao fazer upload da imagem: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("books").getPublicUrl(filePath);

    return publicUrl;
  };

  const createCustomBook = useMutation({
    mutationFn: async (data: CustomBookData & { coverFile?: File }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      let coverUrl = data.cover_url;

      // Upload cover image if provided
      if (data.coverFile) {
        try {
          coverUrl = await uploadCoverImage(data.coverFile);
        } catch (error) {
          console.error("Erro ao fazer upload da capa:", error);
          // Continue without cover image
        }
      }

      // Create custom book entry
      const bookData = {
        user_id: user.id,
        title: data.title,
        author: data.author,
        description: data.description || null,
        total_pages: data.pages,
        cover_url: coverUrl || null,
        isbn: data.isbn || null,
        genres: data.genre ? [data.genre] : [],
        published_year: data.published_year || null,
        status: "want-to-read" as const,
        date_added: new Date().toISOString(),
      };

      const { data: book, error } = await supabase.from("books").insert(bookData).select().single();

      if (error) {
        throw new Error(`Erro ao criar livro: ${error.message}`);
      }

      return book;
    },
    onSuccess: book => {
      toast({
        title: "Livro criado com sucesso!",
        description: `"${book.title}" foi adicionado à sua biblioteca.`,
      });

      // Invalidate books queries to refetch
      queryClient.invalidateQueries({
        queryKey: ["books"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar livro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCustomBook = useMutation({
    mutationFn: async ({
      bookId,
      data,
      coverFile,
    }: {
      bookId: string;
      data: Partial<CustomBookData>;
      coverFile?: File;
    }) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      let coverUrl = data.cover_url;

      // Upload new cover image if provided
      if (coverFile) {
        try {
          coverUrl = await uploadCoverImage(coverFile);
        } catch (error) {
          console.error("Erro ao fazer upload da capa:", error);
        }
      }

      const updateData = {
        ...data,
        cover_url: coverUrl,
      };

      const { data: book, error } = await supabase
        .from("books")
        .update(updateData)
        .eq("id", bookId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar livro: ${error.message}`);
      }

      return book;
    },
    onSuccess: book => {
      toast({
        title: "Livro atualizado!",
        description: `"${book.title}" foi atualizado com sucesso.`,
      });

      queryClient.invalidateQueries({
        queryKey: ["books"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar livro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCustomBook = useMutation({
    mutationFn: async (bookId: string) => {
      if (!user?.id) {
        throw new Error("Usuário não autenticado");
      }

      // Get book data first to delete cover image
      const { data: book } = await supabase
        .from("books")
        .select("cover_url")
        .eq("id", bookId)
        .eq("user_id", user.id)
        .single();

      // Delete cover image from storage if exists and is custom uploaded
      if (book?.cover_url && book.cover_url.includes("book-covers/")) {
        const filePath = book.cover_url.split("/").pop();
        if (filePath) {
          await supabase.storage.from("books").remove([`book-covers/${filePath}`]);
        }
      }

      const { error } = await supabase
        .from("books")
        .delete()
        .eq("id", bookId)
        .eq("user_id", user.id);

      if (error) {
        throw new Error(`Erro ao deletar livro: ${error.message}`);
      }

      return bookId;
    },
    onSuccess: () => {
      toast({
        title: "Livro removido!",
        description: "O livro foi removido da sua biblioteca.",
      });

      queryClient.invalidateQueries({
        queryKey: ["books"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover livro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    createCustomBook,
    updateCustomBook,
    deleteCustomBook,
    isCreating: createCustomBook.isPending,
    isUpdating: updateCustomBook.isPending,
    isDeleting: deleteCustomBook.isPending,
  };
};
