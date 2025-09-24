import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type {
  Challenge,
  UserChallenge,
  ChallengeType,
  ChallengeTargetType,
} from "@/types/reading";

export const useChallenges = () => {
  return useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      // For now, return empty array until we implement the challenges system
      return [] as Challenge[];
    },
  });
};

export const useUserChallenges = (userId?: string) => {
  return useQuery({
    queryKey: ["user-challenges", userId],
    queryFn: async () => {
      if (!userId) return [];
      // For now, return empty array until we implement the challenges system
      return [] as UserChallenge[];
    },
    enabled: !!userId,
  });
};

export const useCreateChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (challenge: {
      title: string;
      description: string;
      type: ChallengeType;
      targetType: ChallengeTargetType;
      targetValue: number;
      startDate: string;
      endDate: string;
      rewardPoints?: number;
    }) => {
      // For now, just return a mock object
      return {
        id: "mock-id",
        ...challenge,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["challenges"],
      });
    },
  });
};

export const useJoinChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (challengeId: string) => {
      // For now, just return success
      return { success: true };
    },
    onSuccess: (_, challengeId) => {
      queryClient.invalidateQueries({
        queryKey: ["user-challenges"],
      });
      queryClient.invalidateQueries({
        queryKey: ["challenge-participants", challengeId],
      });
    },
  });
};

export const useLeaveChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (challengeId: string) => {
      // For now, just return success
      return { success: true };
    },
    onSuccess: (_, challengeId) => {
      queryClient.invalidateQueries({
        queryKey: ["user-challenges"],
      });
      queryClient.invalidateQueries({
        queryKey: ["challenge-participants", challengeId],
      });
    },
  });
};

export const useChallengeParticipants = (
  challengeId: string
) => {
  return useQuery({
    queryKey: ["challenge-participants", challengeId],
    queryFn: async () => {
      // For now, return empty array
      return [];
    },
    enabled: !!challengeId,
  });
};

export const useUpdateChallengeProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      challengeId,
      progress,
    }: {
      challengeId: string;
      progress: number;
    }) => {
      // For now, just return success
      return { success: true, progress };
    },
    onSuccess: (_, { challengeId }) => {
      queryClient.invalidateQueries({
        queryKey: ["user-challenges"],
      });
      queryClient.invalidateQueries({
        queryKey: ["challenge-participants", challengeId],
      });
    },
  });
};
