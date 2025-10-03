import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import type { Activity, Follow, LeaderboardEntry } from "@/types/reading";

export const useActivity = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activity-feed", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        const { data: followingData, error: followsError } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);

        if (followsError) {
          console.log("No follows found or error:", followsError);
        }

        const followingIds = followingData?.map(f => f.following_id) || [];
        const userIds = [user.id, ...followingIds];

        // Get user profiles for the activity feed
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, username, full_name, avatar_url")
          .in("user_id", userIds);

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
        }

        const profileMap = new Map(profilesData?.map(profile => [profile.user_id, profile]) || []);

        // Get recent reading progress from current user only (for now)
        const { data: progressData, error: booksError } = await supabase
          .from("books")
          .select(
            `
            id,
            user_id,
            title,
            author,
            pages_read,
            total_pages,
            created_at,
            updated_at,
            status
          `
          )
          .eq("user_id", user.id) // Start with just current user
          .order("updated_at", { ascending: false })
          .limit(10);

        if (booksError) {
          console.error("Error fetching books:", booksError);
        }

        // Get recent achievements from current user only (for now)
        const { data: achievementData, error: achievementsError } = await supabase
          .from("user_achievements")
          .select(
            `
            id,
            user_id,
            unlocked_at,
            achievements!inner(title, description, icon)
          `
          )
          .eq("user_id", user.id) // Start with just current user
          .order("unlocked_at", { ascending: false })
          .limit(10);

        if (achievementsError) {
          console.error("Error fetching achievements:", achievementsError);
        }

        // Filter out any achievements that shouldn't be there
        const validAchievements =
          achievementData?.filter(
            achievement =>
              achievement.achievements && achievement.unlocked_at && achievement.user_id === user.id
          ) || [];

        const activities: Activity[] = [];

        // Add reading progress activities
        progressData?.forEach(book => {
          const profile = profileMap.get(book.user_id);

          if (book.pages_read === book.total_pages && book.status === "completed") {
            activities.push({
              id: `book-completed-${book.id}`,
              userId: book.user_id,
              type: "book_completed",
              description: `concluiu a leitura de "${book.title}" por ${book.author}`,
              metadata: {
                book_title: book.title,
                author: book.author,
                total_pages: book.total_pages,
              },
              user: profile
                ? {
                    id: profile.user_id,
                    username: profile.username,
                    fullName: profile.full_name,
                    avatarUrl: profile.avatar_url,
                  }
                : undefined,
              createdAt: book.updated_at,
            });
          } else if (book.status === "reading" && book.pages_read > 0) {
            activities.push({
              id: `book-progress-${book.id}`,
              userId: book.user_id,
              type: "reading_progress",
              description: `está lendo "${book.title}" - ${book.pages_read}/${book.total_pages} páginas`,
              metadata: {
                book_title: book.title,
                author: book.author,
                pages_read: book.pages_read,
                total_pages: book.total_pages,
              },
              user: profile
                ? {
                    id: profile.user_id,
                    username: profile.username,
                    fullName: profile.full_name,
                    avatarUrl: profile.avatar_url,
                  }
                : undefined,
              createdAt: book.updated_at,
            });
          }
        });

        // Add achievement activities (only valid ones)
        validAchievements.forEach(achievement => {
          const profile = profileMap.get(achievement.user_id);

          activities.push({
            id: `achievement-${achievement.id}`,
            userId: achievement.user_id,
            type: "achievement_unlocked",
            description: `desbloqueou a conquista "${achievement.achievements.title}"`,
            metadata: {
              achievement_title: achievement.achievements.title,
              achievement_description: achievement.achievements.description,
              achievement_icon: achievement.achievements.icon,
            },
            user: profile
              ? {
                  id: profile.user_id,
                  username: profile.username,
                  fullName: profile.full_name,
                  avatarUrl: profile.avatar_url,
                }
              : undefined,
            createdAt: achievement.unlocked_at,
          });
        });

        // Sort by creation date
        activities.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return activities;
      } catch (error) {
        console.error("Activity Feed - General error:", error);
        return [];
      }
    },
    enabled: !!user?.id,
  });
};

export const useFollows = () => {
  const { user } = useAuth();

  const followers = useQuery({
    queryKey: ["followers", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("follows")
        .select(
          `
          id,
          follower_id,
          following_id,
          created_at,
          follower:profiles!follows_follower_id_fkey(
            user_id,
            username,
            full_name,
            avatar_url
          )
        `
        )
        .eq("following_id", user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const following = useQuery({
    queryKey: ["following", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("follows")
        .select(
          `
          id,
          follower_id,
          following_id,
          created_at,
          following:profiles!follows_following_id_fkey(
            user_id,
            username,
            full_name,
            avatar_url
          )
        `
        )
        .eq("follower_id", user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  return { followers, following };
};

export const useFollowUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      if (user.id === targetUserId) {
        throw new Error("Você não pode seguir a si mesmo");
      }

      // Check if target user exists in profiles
      const { data: targetProfile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", targetUserId)
        .single();

      if (profileError || !targetProfile) {
        throw new Error("Usuário não encontrado");
      }

      // Check if already following
      const { data: existingFollow } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .single();

      if (existingFollow) {
        throw new Error("Você já segue este usuário");
      }

      const { data, error } = await supabase
        .from("follows")
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["followers"],
      });
      queryClient.invalidateQueries({
        queryKey: ["following"],
      });
      queryClient.invalidateQueries({
        queryKey: ["activity-feed"],
      });
      toast({
        title: "Usuário seguido!",
        description: "Você agora segue este usuário.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao seguir usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUnfollowUser = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["followers"],
      });
      queryClient.invalidateQueries({
        queryKey: ["following"],
      });
      queryClient.invalidateQueries({
        queryKey: ["activity-feed"],
      });
      toast({
        title: "Deixou de seguir",
        description: "Você não segue mais este usuário.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao deixar de seguir",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useLeaderboard = () => {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      // Get user profiles with their basic info including current_streak
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(
          `
          user_id,
          username,
          full_name,
          avatar_url,
          current_streak
        `
        )
        .limit(50);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        return [];
      }

      // Calculate stats for each user
      const leaderboardEntries = await Promise.all(
        profiles.map(async profile => {
          // Get completed books count
          const { count: booksCompleted } = await supabase
            .from("books")
            .select("id", { count: "exact" })
            .eq("user_id", profile.user_id)
            .eq("status", "completed");

          // Get total pages read from all books
          const { data: booksData } = await supabase
            .from("books")
            .select("pages_read")
            .eq("user_id", profile.user_id);

          const totalPagesRead =
            booksData?.reduce((sum, book) => sum + (book.pages_read || 0), 0) || 0;

          // Points are now just total pages read (1 point per page)
          const points = totalPagesRead;

          // Determine level based on pages read
          let level = "Iniciante";
          if (points >= 10000) level = "Mestre dos Livros";
          else if (points >= 7500) level = "Bibliófilo Experiente";
          else if (points >= 5000) level = "Bibliófilo";
          else if (points >= 2500) level = "Leitor Dedicado";
          else if (points >= 1000) level = "Leitor Ativo";

          return {
            userId: profile.user_id,
            username: profile.username || "Usuário",
            fullName: profile.full_name || "Nome não informado",
            avatarUrl: profile.avatar_url,
            points,
            level,
            booksCompleted: booksCompleted || 0,
            totalPagesRead,
            readingStreak: profile.current_streak || 0, // Use real current_streak value
            rank: 0, // Will be set after sorting
          };
        })
      );

      // Sort by points and assign ranks
      const sortedEntries = leaderboardEntries
        .sort((a, b) => b.points - a.points)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      return sortedEntries;
    },
  });
};

export const useSearchUsers = () => {
  return useMutation({
    mutationFn: async (query: string) => {
      if (query.length < 2) return [];

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(
          `
          user_id,
          username,
          full_name,
          avatar_url,
          current_streak
        `
        )
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        return [];
      }

      // Calculate basic stats for each found user
      const usersWithStats = await Promise.all(
        profiles.map(async profile => {
          // Get completed books count
          const { count: booksCompleted } = await supabase
            .from("books")
            .select("id", { count: "exact" })
            .eq("user_id", profile.user_id)
            .eq("status", "completed");

          // Get total pages read from all books
          const { data: booksData } = await supabase
            .from("books")
            .select("pages_read")
            .eq("user_id", profile.user_id);

          const totalPagesRead =
            booksData?.reduce((sum, book) => sum + (book.pages_read || 0), 0) || 0;

          // Points are now just total pages read (1 point per page)
          const points = totalPagesRead;

          // Determine level based on pages read
          let level = "Iniciante";
          if (points >= 10000) level = "Mestre dos Livros";
          else if (points >= 7500) level = "Bibliófilo Experiente";
          else if (points >= 5000) level = "Bibliófilo";
          else if (points >= 2500) level = "Leitor Dedicado";
          else if (points >= 1000) level = "Leitor Ativo";

          return {
            userId: profile.user_id,
            username: profile.username || "Usuário",
            fullName: profile.full_name || "Nome não informado",
            avatarUrl: profile.avatar_url,
            points,
            level,
            booksCompleted: booksCompleted || 0,
            totalPagesRead,
            readingStreak: profile.current_streak || 0, // Use real current_streak value
          };
        })
      );

      return usersWithStats;
    },
  });
};

export const useIsFollowing = (targetUserId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-following", user?.id, targetUserId],
    queryFn: async () => {
      if (!user?.id || !targetUserId) return false;

      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return !!data;
    },
    enabled: !!user?.id && !!targetUserId,
  });
};
