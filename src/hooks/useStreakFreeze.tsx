import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

export const useStreakFreeze = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get freeze count
  const { data: freezeData } = useQuery({
    queryKey: ["streak-freezes", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("streak_freezes, freeze_used_dates")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Use a freeze
  const useFreeze = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const currentFreezes = freezeData?.streak_freezes || 0;

      if (currentFreezes <= 0) {
        throw new Error("Você não tem proteções disponíveis");
      }

      const today = new Date().toISOString().split("T")[0];
      const usedDates = freezeData?.freeze_used_dates || [];

      // Check if already used today
      if (usedDates.includes(today)) {
        throw new Error("Você já usou uma proteção hoje");
      }

      // Update freeze count and add today to used dates
      const { error } = await supabase
        .from("profiles")
        .update({
          streak_freezes: currentFreezes - 1,
          freeze_used_dates: [...usedDates, today],
        })
        .eq("user_id", user.id);

      if (error) throw error;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streak-freezes"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      toast({
        title: "❄️ Proteção Ativada!",
        description: "Sua sequência está protegida por hoje.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao usar proteção",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if needs freeze (didn't read yesterday and has active streak)
  const checkNeedFreeze = async () => {
    if (!user?.id) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("current_streak, last_activity_date")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.current_streak === 0) return false;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const lastActivity = profile.last_activity_date;

    // If last activity was not yesterday and not today, might need freeze
    const today = new Date().toISOString().split("T")[0];
    return lastActivity !== yesterdayStr && lastActivity !== today;
  };

  return {
    freezeCount: freezeData?.streak_freezes || 0,
    usedDates: freezeData?.freeze_used_dates || [],
    useFreeze: useFreeze.mutate,
    isUsingFreeze: useFreeze.isPending,
    checkNeedFreeze,
  };
};
