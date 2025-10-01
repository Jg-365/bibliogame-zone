import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "./useToast";
import { getErrorMessage } from "@/shared/utils";
import { QUERY_KEYS } from "@/shared/types";
import type { Profile } from "@/shared/types";

export interface ProfileUpdateData {
  username?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  reading_goal?: number;
  timezone?: string;
  notification_preferences?: {
    daily_reminders: boolean;
    achievement_notifications: boolean;
    social_updates: boolean;
    marketing_emails: boolean;
  };
}

// Raw database profile type
interface DatabaseProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  books_completed: number;
  total_pages_read: number;
  current_streak: number;
  longest_streak: number;
  experience_points: number;
  level: string;
  favorite_genres: string[];
  current_book_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Optimized hook for profile management with intelligent caching
 */
export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profile
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.profile(user?.id || ""),
    queryFn: async (): Promise<DatabaseProfile | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // Profile doesn't exist, return null
          return null;
        }
        throw error;
      }

      return data as DatabaseProfile;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create profile mutation
  const createProfileMutation = useMutation({
    mutationFn: async (
      profileData: Partial<ProfileUpdateData>
    ) => {
      if (!user?.id)
        throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          username: profileData.username,
          email: user.email,
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url,
          bio: profileData.bio,
          reading_goal: profileData.reading_goal || 12,
          timezone:
            profileData.timezone || "America/Sao_Paulo",
          notification_preferences:
            profileData.notification_preferences || {
              daily_reminders: true,
              achievement_notifications: true,
              social_updates: true,
              marketing_emails: false,
            },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newProfile) => {
      // Update the cache with the new profile
      queryClient.setQueryData(
        QUERY_KEYS.profile(user?.id || ""),
        {
          id: newProfile.id,
          username: newProfile.username,
          fullName: newProfile.full_name,
          email: newProfile.email,
          avatarUrl: newProfile.avatar_url,
          bio: newProfile.bio,
          totalBooks: newProfile.total_books || 0,
          totalPages: newProfile.total_pages || 0,
          currentStreak: newProfile.current_streak || 0,
          longestStreak: newProfile.longest_streak || 0,
          points: newProfile.points || 0,
          level: newProfile.level || 1,
          readingGoal: newProfile.reading_goal || 12,
          timezone:
            newProfile.timezone || "America/Sao_Paulo",
          notificationPreferences:
            newProfile.notification_preferences,
          createdAt: newProfile.created_at,
          updatedAt: newProfile.updated_at,
        } as Profile
      );

      toast({
        title: "Perfil criado com sucesso!",
        description:
          "Seu perfil foi configurado. Bem-vindo ao BiblioGame Zone!",
      });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      toast({
        title: "Erro ao criar perfil",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: ProfileUpdateData) => {
      if (!user?.id)
        throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update({
          username: updates.username,
          full_name: updates.full_name,
          avatar_url: updates.avatar_url,
          bio: updates.bio,
          reading_goal: updates.reading_goal,
          timezone: updates.timezone,
          notification_preferences:
            updates.notification_preferences,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.profile(user?.id || ""),
      });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(
        QUERY_KEYS.profile(user?.id || "")
      );

      // Optimistically update
      if (previousProfile) {
        queryClient.setQueryData(
          QUERY_KEYS.profile(user?.id || ""),
          (old: Profile) => ({
            ...old,
            username: updates.username ?? old.username,
            fullName: updates.full_name ?? old.fullName,
            avatarUrl: updates.avatar_url ?? old.avatarUrl,
            bio: updates.bio ?? old.bio,
            readingGoal:
              updates.reading_goal ?? old.readingGoal,
            timezone: updates.timezone ?? old.timezone,
            notificationPreferences:
              updates.notification_preferences ??
              old.notificationPreferences,
          })
        );
      }

      return { previousProfile };
    },
    onError: (error, updates, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          QUERY_KEYS.profile(user?.id || ""),
          context.previousProfile
        );
      }

      const errorMessage = getErrorMessage(error);
      toast({
        title: "Erro ao atualizar perfil",
        description: errorMessage,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado!",
        description:
          "Suas alterações foram salvas com sucesso.",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profile(user?.id || ""),
      });
    },
  });

  // Update reading stats mutation
  const updateStatsOptimisticMutation = useMutation({
    mutationFn: async (stats: {
      totalBooks?: number;
      totalPages?: number;
      currentStreak?: number;
      longestStreak?: number;
      points?: number;
      level?: number;
    }) => {
      if (!user?.id)
        throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .update(stats)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (stats) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.profile(user?.id || ""),
      });

      // Optimistically update
      queryClient.setQueryData(
        QUERY_KEYS.profile(user?.id || ""),
        (old: Profile | undefined) => {
          if (!old) return old;
          return {
            ...old,
            totalBooks: stats.totalBooks ?? old.totalBooks,
            totalPages: stats.totalPages ?? old.totalPages,
            currentStreak:
              stats.currentStreak ?? old.currentStreak,
            longestStreak:
              stats.longestStreak ?? old.longestStreak,
            points: stats.points ?? old.points,
            level: stats.level ?? old.level,
          };
        }
      );
    },
    onError: (error) => {
      // Refetch on error to get the correct state
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profile(user?.id || ""),
      });

      const errorMessage = getErrorMessage(error);
      console.error(
        "Failed to update profile stats:",
        errorMessage
      );
    },
  });

  // Delete profile mutation
  const deleteProfileMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id)
        throw new Error("User not authenticated");

      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Clear all user-related cache
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.profile(user?.id || ""),
      });
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.books(user?.id || ""),
      });
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.achievements(user?.id || ""),
      });

      toast({
        title: "Perfil excluído",
        description:
          "Seu perfil foi removido permanentemente.",
      });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      toast({
        title: "Erro ao excluir perfil",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Computed values
  const hasProfile = !!profile;
  const isNewUser = !hasProfile && !isLoading;

  // Reading progress for current year
  const yearlyProgress = profile?.readingGoal
    ? Math.min(
        (profile.totalBooks / profile.readingGoal) * 100,
        100
      )
    : 0;

  // Level progress (0-100)
  const currentLevelProgress = profile?.level
    ? ((profile.points % 1000) / 1000) * 100
    : 0;

  const nextLevelPoints = profile?.level
    ? profile.level * 1000 - (profile.points % 1000)
    : 1000;

  return {
    // Data
    profile,
    hasProfile,
    isNewUser,
    yearlyProgress,
    currentLevelProgress,
    nextLevelPoints,

    // Loading states
    isLoading,
    isCreating: createProfileMutation.isPending,
    isUpdating: updateProfileMutation.isPending,
    isUpdatingStats:
      updateStatsOptimisticMutation.isPending,
    isDeleting: deleteProfileMutation.isPending,
    error,

    // Actions
    createProfile: createProfileMutation.mutate,
    updateProfile: updateProfileMutation.mutate,
    updateStats: updateStatsOptimisticMutation.mutate,
    deleteProfile: deleteProfileMutation.mutate,

    // Async actions
    createProfileAsync: createProfileMutation.mutateAsync,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    updateStatsAsync:
      updateStatsOptimisticMutation.mutateAsync,
    deleteProfileAsync: deleteProfileMutation.mutateAsync,

    // Utilities
    refreshProfile: () =>
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profile(user?.id || ""),
      }),
  };
};
