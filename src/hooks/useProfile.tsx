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

  return {
    profile,
    isLoading,
    updateProfile: updateProfile.mutate,
    isUpdating: updateProfile.isPending,
    forceRefresh,
  };
};
