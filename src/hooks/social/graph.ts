/**
 * Social Graph hooks â€” follows, leaderboard, user search.
 *
 * Canonical home: `@/hooks/social`.
 * Re-exported from `@/hooks/useSocial` for backward compatibility.
 */
import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { fetchReadingStatsByUsers } from "@/hooks/useReadingStats";
import { trackEvent } from "@/lib/analytics";
import type { Activity, LeaderboardEntry } from "@/shared/types";
import { formatProfileLevel } from "@/shared/utils";

const DAYS_TO_CALCULATE_STREAK = 120;

const toDayKey = (value: string) => {
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

const calculateConsecutiveStreak = (sessionDates: string[]) => {
  if (!sessionDates.length) return 0;

  const uniqueDays = new Set(sessionDates.map(toDayKey).filter(Boolean));
  if (uniqueDays.size === 0) return 0;

  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  const cursor = uniqueDays.has(todayKey)
    ? new Date(today)
    : uniqueDays.has(yesterdayKey)
      ? yesterday
      : null;
  if (!cursor) return 0;

  let streak = 0;
  while (cursor) {
    const key = cursor.toISOString().slice(0, 10);
    if (!uniqueDays.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const deriveUserStats = ({
  userId,
  statsByUser,
  sessionsByUser,
  fallbackStreak,
}: {
  userId: string;
  statsByUser: Map<
    string,
    {
      books_completed: number;
      total_pages_read: number;
      points: number;
    }
  >;
  sessionsByUser: Map<string, string[]>;
  fallbackStreak: number | null;
}) => {
  const userStats = statsByUser.get(userId);
  const booksCompleted = userStats?.books_completed ?? 0;
  const totalPagesRead = userStats?.total_pages_read ?? 0;
  const points = userStats?.points ?? 0;

  const sessions = sessionsByUser.get(userId) ?? [];
  const derivedStreak = calculateConsecutiveStreak(sessions);
  const readingStreak = Math.max(derivedStreak, fallbackStreak ?? 0);

  return {
    booksCompleted,
    totalPagesRead,
    readingStreak,
    points,
  };
};

// â”€â”€â”€ Activity feed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const useActivity = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activity-feed", user?.id],
    queryFn: async (): Promise<Activity[]> => {
      if (!user?.id) return [];

      try {
        const { data: followingData, error: followsError } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);

        if (followsError) {
          console.warn("No follows found:", followsError);
        }

        const followingIds = followingData?.map((f) => f.following_id) ?? [];
        const userIds = [user.id, ...followingIds];

        const [profilesRes, progressRes, achievementRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("user_id, username, full_name, avatar_url")
            .in("user_id", userIds),
          supabase
            .from("books")
            .select(
              "id, user_id, title, author, pages_read, total_pages, created_at, updated_at, status",
            )
            .eq("user_id", user.id)
            .order("updated_at", { ascending: false })
            .limit(10),
          supabase
            .from("user_achievements")
            .select("id, user_id, unlocked_at, achievements!inner(title, description, icon)")
            .eq("user_id", user.id)
            .order("unlocked_at", { ascending: false })
            .limit(10),
        ]);

        if (profilesRes.error) console.error("Profiles error:", profilesRes.error);
        if (progressRes.error) console.error("Books error:", progressRes.error);
        if (achievementRes.error) console.error("Achievements error:", achievementRes.error);

        const profileMap = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));

        const validAchievements = (achievementRes.data ?? []).filter(
          (a) => a.achievements && a.unlocked_at && a.user_id === user.id,
        );

        const activities: Activity[] = [];

        (progressRes.data ?? []).forEach((book) => {
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
              description: `estÃ¡ lendo "${book.title}" - ${book.pages_read}/${book.total_pages} pÃ¡ginas`,
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

        validAchievements.forEach((achievement) => {
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

        activities.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        return activities;
      } catch (error) {
        console.error("Activity feed error:", error);
        return [];
      }
    },
    enabled: !!user?.id,
  });
};

// â”€â”€â”€ Follows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const useFollows = () => {
  const { user } = useAuth();

  const followers = useQuery({
    queryKey: ["followers", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("follows")
        .select(
          `id, follower_id, following_id, created_at, follower:profiles!follows_follower_id_fkey(user_id, username, full_name, avatar_url)`,
        )
        .eq("following_id", user.id);
      if (error) throw error;
      return data ?? [];
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
          `id, follower_id, following_id, created_at, following:profiles!follows_following_id_fkey(user_id, username, full_name, avatar_url)`,
        )
        .eq("follower_id", user.id);
      if (error) throw error;
      return data ?? [];
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
      if (user.id === targetUserId) throw new Error("VocÃª nÃ£o pode seguir a si mesmo");

      const { data: targetProfile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", targetUserId)
        .single();

      if (profileError || !targetProfile) throw new Error("UsuÃ¡rio nÃ£o encontrado");

      const { data: existingFollow } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .single();

      if (existingFollow) throw new Error("VocÃª jÃ¡ segue este usuÃ¡rio");

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
    onSuccess: async (_data, targetUserId) => {
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
        title: "UsuÃ¡rio seguido!",
        description: "VocÃª agora segue este usuÃ¡rio.",
      });
      await trackEvent({
        userId: user?.id,
        eventName: "user_followed",
        eventCategory: "social",
        payload: { targetUserId },
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao seguir usuÃ¡rio",
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
    onSuccess: async (_data, targetUserId) => {
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
        description: "VocÃª nÃ£o segue mais este usuÃ¡rio.",
      });
      await trackEvent({
        userId: user?.id,
        eventName: "user_unfollowed",
        eventCategory: "social",
        payload: { targetUserId },
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao deixar de seguir",
        description: error.message,
        variant: "destructive",
      });
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
      if (error && error.code !== "PGRST116") throw error;
      return !!data;
    },
    enabled: !!user?.id && !!targetUserId,
  });
};

// â”€â”€â”€ Leaderboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const useLeaderboard = () => {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select(
          "user_id, username, full_name, avatar_url, current_streak, points, books_completed, total_pages_read, level",
        )
        .order("total_pages_read", { ascending: false })
        .limit(100);

      if (profilesError) throw profilesError;
      if (!profiles?.length) return [];

      const userIds = profiles.map((profile) => profile.user_id);
      const minSessionDate = new Date();
      minSessionDate.setDate(minSessionDate.getDate() - DAYS_TO_CALCULATE_STREAK);

      const [statsRows, { data: sessionsData, error: sessionsError }] = await Promise.all([
        fetchReadingStatsByUsers(userIds),
        supabase
          .from("reading_sessions")
          .select("user_id, session_date")
          .in("user_id", userIds)
          .gte("session_date", minSessionDate.toISOString()),
      ]);

      if (sessionsError) throw sessionsError;

      const statsByUser = new Map<string, (typeof statsRows)[number]>();
      statsRows.forEach((row) => {
        statsByUser.set(row.user_id, row);
      });

      const sessionsByUser = new Map<string, string[]>();
      (sessionsData ?? []).forEach((session) => {
        const list = sessionsByUser.get(session.user_id) ?? [];
        if (session.session_date) list.push(session.session_date);
        sessionsByUser.set(session.user_id, list);
      });

      const leaderboardEntries = profiles.map((profile) => {
        const stats = deriveUserStats({
          userId: profile.user_id,
          statsByUser,
          sessionsByUser,
          fallbackStreak: profile.current_streak,
        });

        return {
          id: profile.user_id,
          username: profile.username ?? "Usuário",
          fullName: profile.full_name ?? "Nome não informado",
          avatarUrl: profile.avatar_url,
          points: stats.points,
          level: formatProfileLevel({
            level: profile.level,
            total_pages_read: stats.totalPagesRead,
          }),
          booksCompleted: stats.booksCompleted,
          totalPagesRead: stats.totalPagesRead,
          readingStreak: stats.readingStreak,
          rank: 0,
        };
      });

      return leaderboardEntries
        .sort((a, b) => b.points - a.points)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previous) => previous,
  });
};
export const useLeaderboardHash = () => {
  const { data: list = [] } = useLeaderboard();
  return useMemo(() => new Map((list as LeaderboardEntry[]).map((u) => [u.id, u])), [list]);
};

// â”€â”€â”€ User search â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const useSearchUsers = () => {
  return useMutation({
    mutationFn: async (query: string) => {
      if (query.length < 2) return [];

      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(
          "user_id, username, full_name, avatar_url, current_streak, points, books_completed, total_pages_read, level",
        )
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      if (!profiles?.length) return [];

      const userIds = profiles.map((profile) => profile.user_id);
      const minSessionDate = new Date();
      minSessionDate.setDate(minSessionDate.getDate() - DAYS_TO_CALCULATE_STREAK);

      const [statsRows, { data: sessionsData, error: sessionsError }] = await Promise.all([
        fetchReadingStatsByUsers(userIds),
        supabase
          .from("reading_sessions")
          .select("user_id, session_date")
          .in("user_id", userIds)
          .gte("session_date", minSessionDate.toISOString()),
      ]);

      if (sessionsError) throw sessionsError;

      const statsByUser = new Map<string, (typeof statsRows)[number]>();
      statsRows.forEach((row) => {
        statsByUser.set(row.user_id, row);
      });

      const sessionsByUser = new Map<string, string[]>();
      (sessionsData ?? []).forEach((session) => {
        const list = sessionsByUser.get(session.user_id) ?? [];
        if (session.session_date) list.push(session.session_date);
        sessionsByUser.set(session.user_id, list);
      });

      return profiles.map((profile) => {
        const stats = deriveUserStats({
          userId: profile.user_id,
          statsByUser,
          sessionsByUser,
          fallbackStreak: profile.current_streak,
        });

        return {
          id: profile.user_id,
          username: profile.username ?? "Usuário",
          fullName: profile.full_name ?? "Nome não informado",
          avatarUrl: profile.avatar_url,
          points: stats.points,
          level: formatProfileLevel({
            level: profile.level,
            total_pages_read: stats.totalPagesRead,
          }),
          booksCompleted: stats.booksCompleted,
          totalPagesRead: stats.totalPagesRead,
          readingStreak: stats.readingStreak,
        };
      });
    },
  });
};
