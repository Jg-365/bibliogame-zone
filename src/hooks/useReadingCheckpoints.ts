import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ReadingCheckpoint {
  id: string;
  user_id: string;
  book_id: string;
  page_number: number;
  chapter_label?: string | null;
  user_summary: string;
  excerpt?: string | null;
  spoiler_level: "none" | "mild" | "full";
  created_at: string;
  updated_at: string;
}

interface CreateCheckpointInput {
  bookId: string;
  pageNumber: number;
  chapterLabel?: string;
  userSummary: string;
  excerpt?: string;
  spoilerLevel?: "none" | "mild" | "full";
}

export const useReadingCheckpoints = (bookId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: checkpoints = [], isLoading } = useQuery({
    queryKey: ["reading-checkpoints", user?.id, bookId],
    queryFn: async () => {
      if (!user?.id || !bookId) return [] as ReadingCheckpoint[];

      const { data, error } = await (supabase as any)
        .from("reading_checkpoints")
        .select("*")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .order("page_number", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []) as ReadingCheckpoint[];
    },
    enabled: !!user?.id && !!bookId,
    staleTime: 5 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const createCheckpoint = useMutation({
    mutationFn: async (input: CreateCheckpointInput) => {
      if (!user?.id) throw new Error("Usuario nao autenticado.");
      if (!input.bookId) throw new Error("Selecione um livro.");
      if (input.pageNumber <= 0) throw new Error("A pagina deve ser maior que zero.");
      if (!input.userSummary.trim()) throw new Error("Resumo do checkpoint e obrigatorio.");

      const { data, error } = await (supabase as any)
        .from("reading_checkpoints")
        .insert({
          user_id: user.id,
          book_id: input.bookId,
          page_number: input.pageNumber,
          chapter_label: input.chapterLabel?.trim() || null,
          user_summary: input.userSummary.trim(),
          excerpt: input.excerpt?.trim() || null,
          spoiler_level: input.spoilerLevel ?? "none",
        })
        .select("*")
        .single();

      if (error) throw error;
      return data as ReadingCheckpoint;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reading-checkpoints", user?.id, bookId],
      });
      toast({
        title: "Checkpoint salvo",
        description: "O copiloto agora entende melhor sua parte atual do livro.",
      });
    },
    onError: (error: unknown) => {
      toast({
        title: "Erro ao salvar checkpoint",
        description: error instanceof Error ? error.message : "Nao foi possivel salvar.",
        variant: "destructive",
      });
    },
  });

  const deleteCheckpoint = useMutation({
    mutationFn: async (checkpointId: string) => {
      if (!user?.id) throw new Error("Usuario nao autenticado.");
      const { error } = await (supabase as any)
        .from("reading_checkpoints")
        .delete()
        .eq("id", checkpointId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reading-checkpoints", user?.id, bookId],
      });
    },
  });

  return {
    checkpoints,
    isLoading,
    createCheckpoint: createCheckpoint.mutateAsync,
    isCreatingCheckpoint: createCheckpoint.isPending,
    deleteCheckpoint: deleteCheckpoint.mutateAsync,
    isDeletingCheckpoint: deleteCheckpoint.isPending,
  };
};
