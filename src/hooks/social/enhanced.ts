/**
 * Enhanced social hooks — activities, achievements, public profiles/leaderboard.
 *
 * Canonical home: `@/hooks/social`.
 * Re-exported from `@/hooks/useEnhancedSocial` for backward compatibility.
 */
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PublicProfile {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  points: number;
  level: string;
  books_completed: number;
  total_pages_read: number;
  current_streak: number;
  longest_streak: number;
  is_private: boolean;
  created_at: string;
}

export interface PublicBook {
  id: string;
  user_id: string;
  title: string;
  author: string;
  cover_url: string;
  pages_read: number;
  total_pages: number;
  status: string;
  rating: number;
  review: string;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export interface PublicActivity {
  id: string;
  user_id: string;
  type: "book_completed" | "achievement_unlocked" | "reading_progress" | "streak_milestone";
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  user: {
    user_id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

export interface LeaderboardUser {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  points: number;
  level: string;
  books_completed: number;
  total_pages_read: number;
  current_streak: number;
  longest_streak: number;
  rank: number;
}

export interface Activity {
  id: string;
  user_id: string;
  activity_type:
    | "book_added"
    | "book_completed"
    | "book_started"
    | "reading_session"
    | "post_created"
    | "post_liked"
    | "comment_added"
    | "achievement_unlocked"
    | "profile_updated";
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  user_username?: string;
  user_avatar_url?: string;
  user_full_name?: string;
}

export interface EnhancedAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: string;
  requirement_type: string;
  requirement_value: number;
  unlocked: boolean;
  unlocked_at?: string;
  progress: number;
  progress_text: string;
}

// ─── Activities ───────────────────────────────────────────────────────────────

export const useActivities = (userId?: string, limit = 20) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activities", userId ?? "all", limit],
    queryFn: async (): Promise<Activity[]> => {
      try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { data: posts, error: postsError } = await supabase
          .from("social_posts")
          .select("id, content, created_at, user_id, book_id")
          .gte("created_at", startOfDay.toISOString())
          .order("created_at", { ascending: false })
          .limit(limit);

        if (postsError) throw postsError;
        if (!posts?.length) return [];

        const userIds = [...new Set(posts.map((p) => p.user_id))];
        const bookIds = posts.filter((p) => p.book_id).map((p) => p.book_id!);

        const [profilesRes, booksRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("user_id, username, avatar_url, full_name")
            .in("user_id", userIds),
          bookIds.length
            ? supabase.from("books").select("id, title, author").in("id", bookIds)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (profilesRes.error) console.warn("Profiles error:", profilesRes.error);

        const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));
        const booksMap = new Map((booksRes.data ?? []).map((b) => [b.id, b]));

        return posts.map((post) => {
          const profile = profileMap.get(post.user_id);
          const book = post.book_id ? booksMap.get(post.book_id) : undefined;

          return {
            id: post.id,
            user_id: post.user_id,
            activity_type: (post.book_id
              ? "book_started"
              : "post_created") as Activity["activity_type"],
            description: post.content,
            metadata: {
              book_title: book?.title,
              book_author: book?.author,
            },
            created_at: post.created_at ?? new Date().toISOString(),
            user_username: profile?.username,
            user_avatar_url: profile?.avatar_url,
            user_full_name: profile?.full_name,
          };
        });
      } catch (err) {
        console.error("Error fetching activities:", err);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 60 * 1000,
  });
};

// ─── Achievements ─────────────────────────────────────────────────────────────

interface UserStatsRow {
  books_completed: number;
  total_pages_read: number;
  current_streak: number;
  longest_streak: number;
  posts_created: number;
  likes_received: number;
  books_added: number;
  reviews_written: number;
}

export const useEnhancedAchievements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allAchievements = [], isLoading: isLoadingAchievements } = useQuery({
    queryKey: ["achievements-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_value", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: userAchievements = [], isLoading: isLoadingUserAchievements } = useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const { data: userStats } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async (): Promise<UserStatsRow | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) throw error;

      const postIdsSub = supabase.from("social_posts").select("id").eq("user_id", user.id);

      const [postsCount, likesReceived, booksAdded, reviewsWritten] = await Promise.all([
        supabase.from("social_posts").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase
          .from("post_likes")
          .select("id", { count: "exact" })
          .in("post_id", await postIdsSub.then((res) => res.data?.map((p) => p.id) ?? [])),
        supabase.from("books").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase
          .from("books")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .not("review", "is", null),
      ]);

      return {
        ...data,
        posts_created: postsCount.count ?? 0,
        likes_received: likesReceived.count ?? 0,
        books_added: booksAdded.count ?? 0,
        reviews_written: reviewsWritten.count ?? 0,
      };
    },
    enabled: !!user?.id,
  });

  const enrichedAchievements: EnhancedAchievement[] = allAchievements.map((achievement) => {
    const userAchievement = userAchievements.find((ua) => ua.achievement_id === achievement.id);
    const isUnlocked = !!userAchievement;

    let currentValue = 0;
    if (userStats) {
      switch (achievement.requirement_type) {
        case "books_read":
          currentValue = userStats.books_completed ?? 0;
          break;
        case "pages_read":
          currentValue = userStats.total_pages_read ?? 0;
          break;
        case "streak_days":
          currentValue = Math.max(userStats.current_streak ?? 0, userStats.longest_streak ?? 0);
          break;
        case "posts_created":
          currentValue = userStats.posts_created ?? 0;
          break;
        case "likes_received":
          currentValue = userStats.likes_received ?? 0;
          break;
        case "books_added":
          currentValue = userStats.books_added ?? 0;
          break;
        case "reviews_written":
          currentValue = userStats.reviews_written ?? 0;
          break;
        default:
          currentValue = 0;
      }
    }

    const progress = Math.min((currentValue / achievement.requirement_value) * 100, 100);

    return {
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      rarity: achievement.rarity,
      requirement_type: achievement.requirement_type,
      requirement_value: achievement.requirement_value,
      unlocked: isUnlocked,
      unlocked_at: userAchievement?.unlocked_at,
      progress,
      progress_text: `${currentValue}/${achievement.requirement_value}`,
    };
  });

  const checkAchievements = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase.rpc("check_and_grant_achievements", {
        p_user_id: user.id,
      });
      if (error) throw error;
      return (
        (data as Array<{
          icon: string;
          title: string;
          description: string;
        }>) ?? []
      );
    },
    onSuccess: (newAchievements) => {
      if (newAchievements.length > 0) {
        queryClient.invalidateQueries({
          queryKey: ["user-achievements"],
        });
        queryClient.invalidateQueries({
          queryKey: ["activities"],
        });
        newAchievements.forEach((achievement) => {
          toast({
            title: "Conquista Desbloqueada!",
            description: `${achievement.icon} ${achievement.title} — ${achievement.description}`,
          });
        });
      }
    },
    onError: (error) => console.error("Error checking achievements:", error),
  });

  return {
    achievements: enrichedAchievements,
    isLoading: isLoadingAchievements || isLoadingUserAchievements,
    unlockedCount: enrichedAchievements.filter((a) => a.unlocked).length,
    totalCount: enrichedAchievements.length,
    checkAchievements: checkAchievements.mutate,
    isCheckingAchievements: checkAchievements.isPending,
  };
};

// ─── Create activity ──────────────────────────────────────────────────────────

export const useCreateActivity = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      activityType,
      description,
      metadata = {},
    }: {
      activityType: Activity["activity_type"];
      description: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("social_posts")
        .insert({
          user_id: user.id,
          content: description,
          book_id: (metadata as Record<string, string>).book_id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["activities"],
      });
      queryClient.invalidateQueries({
        queryKey: ["social-posts"],
      });
    },
  });
};

// ─── Public profiles ──────────────────────────────────────────────────────────

export const usePublicProfiles = (limit = 20) => {
  return useQuery({
    queryKey: ["public-profiles", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "user_id, username, full_name, avatar_url, bio, points, level, books_completed, total_pages_read, current_streak, longest_streak, created_at",
        )
        .order("points", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const usePublicUserBooks = (userId: string) => {
  return useQuery({
    queryKey: ["public-user-books", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("books")
        .select(
          "id, user_id, title, author, cover_url, pages_read, total_pages, status, rating, review, created_at, updated_at",
        )
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as PublicBook[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};

// ─── Enhanced leaderboard ─────────────────────────────────────────────────────

export const useEnhancedLeaderboard = (
  type: "points" | "books" | "pages" | "streak" = "points",
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["enhanced-leaderboard", type],
    enabled: options?.enabled ?? true,
    queryFn: async (): Promise<LeaderboardUser[]> => {
      const orderBy =
        type === "books"
          ? "books_completed"
          : type === "pages"
            ? "total_pages_read"
            : type === "streak"
              ? "longest_streak"
              : "points";

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "user_id, username, full_name, avatar_url, points, level, books_completed, total_pages_read, current_streak, longest_streak",
        )
        .order(orderBy, { ascending: false })
        .limit(100);

      if (error) throw error;

      return (data ?? []).map((user, index) => ({
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        points: user.points ?? 0,
        level: user.level ?? "",
        books_completed: user.books_completed ?? 0,
        total_pages_read: user.total_pages_read ?? 0,
        current_streak: user.current_streak ?? 0,
        longest_streak: user.longest_streak ?? 0,
        rank: index + 1,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useLeaderboardHash = (
  type: "points" | "books" | "pages" | "streak" = "points",
  options?: { enabled?: boolean },
) => {
  const { data: list = [] } = useEnhancedLeaderboard(type, options);
  return useMemo(() => new Map((list as LeaderboardUser[]).map((u) => [u.user_id, u])), [list]);
};

// ─── Public activity feed ─────────────────────────────────────────────────────

export const usePublicActivityFeed = () => {
  return useQuery({
    queryKey: ["public-activity-feed"],
    queryFn: async (): Promise<PublicActivity[]> => {
      const { data: completedBooks, error: booksError } = await supabase
        .from("books")
        .select("id, user_id, title, author, cover_url, updated_at, rating")
        .eq("status", "lido")
        .order("updated_at", { ascending: false })
        .limit(20);

      if (booksError) {
        console.error("Error fetching completed books:", booksError);
        return [];
      }

      const userIds = [...new Set((completedBooks ?? []).map((b) => b.user_id))];

      const [profilesRes, achievementsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, username, full_name, avatar_url")
          .in("user_id", userIds),
        supabase
          .from("user_achievements")
          .select("id, user_id, unlocked_at, achievement_id")
          .order("unlocked_at", { ascending: false })
          .limit(20),
      ]);

      if (profilesRes.error) {
        console.error("Error fetching profiles:", profilesRes.error);
        return [];
      }
      if (achievementsRes.error) {
        console.error("Error fetching achievements:", achievementsRes.error);
        return [];
      }

      const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));

      const achievementIds = [
        ...new Set((achievementsRes.data ?? []).map((a) => a.achievement_id)),
      ];
      const { data: achievementDetails } = achievementIds.length
        ? await supabase
            .from("achievements")
            .select("id, title, description, icon, rarity")
            .in("id", achievementIds)
        : {
            data: [] as Array<{
              id: string;
              title: string;
              description: string;
              icon: string;
              rarity: string;
            }>,
          };

      const achievementMap = new Map((achievementDetails ?? []).map((a) => [a.id, a]));

      const activities: PublicActivity[] = [];

      (completedBooks ?? []).forEach((book) => {
        const profile = profileMap.get(book.user_id);
        if (profile) {
          activities.push({
            id: `book-${book.id}`,
            user_id: book.user_id,
            type: "book_completed",
            title: `${profile.full_name ?? profile.username} concluiu um livro`,
            description: `"${book.title}" por ${book.author}`,
            metadata: {
              bookTitle: book.title,
              bookAuthor: book.author,
              bookCover: book.cover_url,
              rating: book.rating,
            },
            created_at: book.updated_at,
            user: {
              user_id: profile.user_id,
              username: profile.username,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
            },
          });
        }
      });

      (achievementsRes.data ?? []).forEach((achievement) => {
        const profile = profileMap.get(achievement.user_id);
        const achievementData = achievementMap.get(achievement.achievement_id);
        if (profile && achievementData) {
          activities.push({
            id: `achievement-${achievement.id}`,
            user_id: achievement.user_id,
            type: "achievement_unlocked",
            title: `${profile.full_name ?? profile.username} desbloqueou uma conquista`,
            description: `"${achievementData.title}" — ${achievementData.description}`,
            metadata: {
              achievementTitle: achievementData.title,
              achievementDescription: achievementData.description,
              achievementIcon: achievementData.icon,
              achievementRarity: achievementData.rarity,
            },
            created_at: achievement.unlocked_at,
            user: {
              user_id: profile.user_id,
              username: profile.username,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url,
            },
          });
        }
      });

      activities.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      return activities.slice(0, 50);
    },
    staleTime: 2 * 60 * 1000,
  });
};

// ─── Public user search ───────────────────────────────────────────────────────

export const usePublicUserSearch = (searchTerm: string) => {
  return useQuery({
    queryKey: ["public-user-search", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "user_id, username, full_name, avatar_url, bio, points, level, books_completed, total_pages_read, current_streak, longest_streak",
        )
        .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .order("points", { ascending: false })
        .limit(20);
      if (error) {
        console.error("Error searching users:", error);
        return [];
      }
      return data ?? [];
    },
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 30 * 1000,
  });
};

// ─── Profile visibility ───────────────────────────────────────────────────────

export const useProfileVisibility = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getCurrentBio = async (): Promise<string> => {
    if (!user?.id) return "";
    const { data } = await supabase.from("profiles").select("bio").eq("user_id", user.id).single();
    return data?.bio ?? "";
  };

  const updateVisibility = useMutation({
    mutationFn: async (makePrivate: boolean) => {
      if (!user?.id) throw new Error("Not authenticated");
      const currentBio = await getCurrentBio();
      const { error } = await supabase
        .from("profiles")
        .update({
          bio: makePrivate ? `${currentBio} [PRIVATE]` : currentBio.replace(" [PRIVATE]", ""),
        })
        .eq("user_id", user.id);
      if (error) throw error;
      return makePrivate;
    },
    onSuccess: (isPrivate) => {
      toast({
        title: "Visibilidade atualizada",
        description: isPrivate
          ? "Seu perfil foi marcado como privado"
          : "Seu perfil foi marcado como público",
      });
      queryClient.invalidateQueries({
        queryKey: ["public-profiles"],
      });
      queryClient.invalidateQueries({
        queryKey: ["public-activity-feed"],
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar visibilidade",
        description: "Não foi possível alterar a configuração",
        variant: "destructive",
      });
    },
  });

  return {
    updateVisibility: updateVisibility.mutate,
    isUpdating: updateVisibility.isPending,
  };
};
