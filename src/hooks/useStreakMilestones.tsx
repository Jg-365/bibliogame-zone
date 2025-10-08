import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

interface Milestone {
  id: string;
  user_id: string;
  milestone_type: string;
  streak_value: number;
  achieved_at: string;
  shared_to_feed: boolean;
}

const MILESTONE_LABELS: Record<string, string> = {
  "3days": "🔥 3 Dias - Aquecendo",
  "7days": "⭐ 7 Dias - Uma Semana",
  "14days": "💪 14 Dias - Duas Semanas",
  "30days": "🎯 30 Dias - Um Mês",
  "90days": "💎 90 Dias - Trimestre",
  "365days": "👑 365 Dias - Ano Completo",
};

export const useStreakMilestones = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get user's milestones
  const { data: milestones = [], isLoading } = useQuery<Milestone[]>({
    queryKey: ["streak-milestones", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("streak_milestones")
        .select("*")
        .eq("user_id", user.id)
        .order("achieved_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Share milestone to feed
  const shareMilestone = useMutation({
    mutationFn: async ({
      milestoneId,
      milestoneType,
    }: {
      milestoneId: string;
      milestoneType: string;
    }) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      // Mark milestone as shared
      const { error: updateError } = await supabase
        .from("streak_milestones")
        .update({ shared_to_feed: true })
        .eq("id", milestoneId);

      if (updateError) throw updateError;

      // Create a post about the milestone
      const { error: postError } = await supabase.from("posts").insert({
        user_id: user.id,
        content: `🎉 Conquistei o marco ${MILESTONE_LABELS[milestoneType]}! Continue acompanhando minha jornada de leitura! 📚`,
        post_type: "milestone",
      });

      if (postError) throw postError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streak-milestones"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });

      toast({
        title: "✨ Marco Compartilhado!",
        description: "Sua conquista foi compartilhada no feed social.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao compartilhar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check for new milestones (client-side)
  const checkForNewMilestones = async (currentStreak: number) => {
    if (!user?.id) return;

    const milestoneTypes = [
      { type: "3days", value: 3 },
      { type: "7days", value: 7 },
      { type: "14days", value: 14 },
      { type: "30days", value: 30 },
      { type: "90days", value: 90 },
      { type: "365days", value: 365 },
    ];

    for (const milestone of milestoneTypes) {
      if (currentStreak === milestone.value) {
        // Check if already exists
        const exists = milestones.some(
          m => m.milestone_type === milestone.type && m.streak_value === milestone.value
        );

        if (!exists) {
          // Show toast for new milestone
          toast({
            title: `🎉 Novo Marco Alcançado!`,
            description: MILESTONE_LABELS[milestone.type],
            duration: 5000,
          });
        }
      }
    }
  };

  return {
    milestones,
    isLoading,
    shareMilestone: shareMilestone.mutate,
    isSharing: shareMilestone.isPending,
    checkForNewMilestones,
    getMilestoneLabel: (type: string) => MILESTONE_LABELS[type] || type,
  };
};
