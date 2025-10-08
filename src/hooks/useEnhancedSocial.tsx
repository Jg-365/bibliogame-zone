import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

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
  metadata: Record<string, any>;
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
  metadata: any;
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

// Hook para atividades recentes - baseado em posts sociais como proxy
export const useActivities = (userId?: string, limit = 20) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activities", userId || "all", limit],
    queryFn: async (): Promise<Activity[]> => {
      try {
        // Buscar posts sociais
        const { data: posts, error: postsError } = await supabase
          .from("social_posts")
          .select(
            `
            id,
            content,
            created_at,
            user_id,
            book_id
          `
          )
          .order("created_at", { ascending: false })
          .limit(limit);

        if (postsError) throw postsError;

        if (!posts || posts.length === 0) return [];

        // Buscar perfis dos usuários dos posts
        const userIds = [...new Set(posts.map(post => post.user_id))];
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, username, avatar_url, full_name")
          .in("user_id", userIds);

        if (profilesError) {
          console.warn("Error fetching profiles:", profilesError);
        }

        // Buscar informações dos livros (se houver)
        const bookIds = posts.filter(post => post.book_id).map(post => post.book_id!);
        let books: any[] = [];
        if (bookIds.length > 0) {
          const { data: booksData, error: booksError } = await supabase
            .from("books")
            .select("id, title, author")
            .in("id", bookIds);

          if (booksError) {
            console.warn("Error fetching books:", booksError);
          } else {
            books = booksData || [];
          }
        }

        // Combinar dados
        return posts.map(post => {
          const profile = profiles?.find(p => p.user_id === post.user_id);
          const book = books.find(b => b.id === post.book_id);

          return {
            id: post.id,
            user_id: post.user_id,
            activity_type: post.book_id ? "book_post" : ("general_post" as any),
            description: post.content,
            metadata: {
              book_title: book?.title,
              book_author: book?.author,
            },
            created_at: post.created_at || new Date().toISOString(),
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
  });
};

// Hook aprimorado para conquistas
export const useEnhancedAchievements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todas as conquistas
  const { data: allAchievements = [], isLoading: isLoadingAchievements } = useQuery({
    queryKey: ["achievements-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_value", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Buscar conquistas do usuário
  const { data: userAchievements = [], isLoading: isLoadingUserAchievements } = useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Buscar estatísticas do usuário
  const { data: userStats } = useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      // Buscar estatísticas adicionais
      const [postsCount, likesReceived, booksAdded, reviewsWritten] = await Promise.all([
        supabase.from("social_posts").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase
          .from("post_likes")
          .select("id", { count: "exact" })
          .in(
            "post_id",
            await supabase
              .from("social_posts")
              .select("id")
              .eq("user_id", user.id)
              .then(res => res.data?.map(p => p.id) || [])
          ),
        supabase.from("books").select("id", { count: "exact" }).eq("user_id", user.id),
        supabase
          .from("books")
          .select("id", { count: "exact" })
          .eq("user_id", user.id)
          .not("review", "is", null),
      ]);

      return {
        ...data,
        posts_created: postsCount.count || 0,
        likes_received: likesReceived.count || 0,
        books_added: booksAdded.count || 0,
        reviews_written: reviewsWritten.count || 0,
      };
    },
    enabled: !!user?.id,
  });

  // Combinar dados para criar conquistas enriquecidas
  const enrichedAchievements: EnhancedAchievement[] = allAchievements.map(achievement => {
    const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
    const isUnlocked = !!userAchievement;

    // Calcular progresso
    let currentValue = 0;
    if (userStats) {
      switch (achievement.requirement_type) {
        case "books_read":
          currentValue = userStats.books_completed || 0;
          break;
        case "pages_read":
          currentValue = userStats.total_pages_read || 0;
          break;
        case "streak_days":
          currentValue = Math.max(userStats.current_streak || 0, userStats.longest_streak || 0);
          break;
        case "posts_created":
          currentValue = userStats.posts_created || 0;
          break;
        case "likes_received":
          currentValue = userStats.likes_received || 0;
          break;
        case "books_added":
          currentValue = userStats.books_added || 0;
          break;
        case "reviews_written":
          currentValue = userStats.reviews_written || 0;
          break;
        default:
          currentValue = 0;
      }
    }

    const progress = Math.min((currentValue / achievement.requirement_value) * 100, 100);
    const progressText = `${currentValue}/${achievement.requirement_value}`;

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
      progress_text: progressText,
    };
  });

  // Verificar conquistas
  const checkAchievements = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      // Usar a função RPC existente
      const { data, error } = await supabase.rpc("check_and_grant_achievements", {
        p_user_id: user.id,
      });

      if (error) throw error;
      return data || [];
    },
    onSuccess: newAchievements => {
      if (newAchievements.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["user-achievements"] });
        queryClient.invalidateQueries({ queryKey: ["activities"] });

        // Mostrar toast para conquistas desbloqueadas
        newAchievements.forEach((achievement: any) => {
          toast({
            title: "🏆 Conquista Desbloqueada!",
            description: `${achievement.icon} ${achievement.title} - ${achievement.description}`,
          });
        });
      }
    },
    onError: error => {
      console.error("Error checking achievements:", error);
    },
  });

  const unlockedCount = enrichedAchievements.filter(a => a.unlocked).length;
  const totalCount = enrichedAchievements.length;

  return {
    achievements: enrichedAchievements,
    isLoading: isLoadingAchievements || isLoadingUserAchievements,
    unlockedCount,
    totalCount,
    checkAchievements: checkAchievements.mutate,
    isCheckingAchievements: checkAchievements.isPending,
  };
};

// Hook para criar atividade manual (se necessário)
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
      metadata?: any;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Como não temos tabela user_activities, criamos um post social para registrar a atividade
      const { data, error } = await supabase
        .from("social_posts")
        .insert({
          user_id: user.id,
          content: description,
          book_id: metadata.book_id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["social-posts"] });
    },
  });
};

// NEW ENHANCED SOCIAL HOOKS FOR BETTER VISIBILITY

// Hook to get public profiles
export const usePublicProfiles = (limit: number = 20) => {
  return useQuery({
    queryKey: ["public-profiles", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          user_id,
          username,
          full_name,
          avatar_url,
          bio,
          points,
          level,
          books_completed,
          total_pages_read,
          current_streak,
          longest_streak,
          created_at
        `
        )
        .order("points", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get public books from a specific user
export const usePublicUserBooks = (userId: string) => {
  return useQuery({
    queryKey: ["public-user-books", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("books")
        .select(
          `
          id,
          user_id,
          title,
          author,
          cover_url,
          pages_read,
          total_pages,
          status,
          rating,
          review,
          created_at,
          updated_at
        `
        )
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as PublicBook[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook to get enhanced leaderboard with more details
export const useEnhancedLeaderboard = (
  type: "points" | "books" | "pages" | "streak" = "points"
) => {
  return useQuery({
    queryKey: ["enhanced-leaderboard", type],
    queryFn: async (): Promise<LeaderboardUser[]> => {
      let orderBy: string;
      switch (type) {
        case "books":
          orderBy = "books_completed";
          break;
        case "pages":
          orderBy = "total_pages_read";
          break;
        case "streak":
          orderBy = "longest_streak";
          break;
        default:
          orderBy = "points";
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "user_id, username, full_name, avatar_url, points, level, books_completed, total_pages_read, current_streak, longest_streak"
        )
        .order(orderBy, { ascending: false })
        .limit(100);

      if (error) throw error;

      // Add rank to each user
      const rankedData: LeaderboardUser[] = (data || []).map((user, index) => ({
        user_id: user.user_id,
        username: user.username,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        points: user.points || 0,
        level: user.level || "",
        books_completed: user.books_completed || 0,
        total_pages_read: user.total_pages_read || 0,
        current_streak: user.current_streak || 0,
        longest_streak: user.longest_streak || 0,
        rank: index + 1,
      }));

      return rankedData;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get public activity feed (simplified version)
export const usePublicActivityFeed = () => {
  return useQuery({
    queryKey: ["public-activity-feed"],
    queryFn: async () => {
      // Get recent completed books - simplified version
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

      // Get user profiles for the books
      const userIds = [...new Set(completedBooks?.map(book => book.user_id) || [])];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url")
        .in("user_id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return [];
      }

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Get recent achievements
      const { data: achievements, error: achievementsError } = await supabase
        .from("user_achievements")
        .select(
          `
          id,
          user_id,
          unlocked_at,
          achievement_id
        `
        )
        .order("unlocked_at", { ascending: false })
        .limit(20);

      if (achievementsError) {
        console.error("Error fetching achievements:", achievementsError);
        return [];
      }

      // Get achievement details
      const achievementIds = [...new Set(achievements?.map(a => a.achievement_id) || [])];
      const { data: achievementDetails, error: achievementDetailsError } = await supabase
        .from("achievements")
        .select("id, title, description, icon, rarity")
        .in("id", achievementIds);

      if (achievementDetailsError) {
        console.error("Error fetching achievement details:", achievementDetailsError);
      }

      const achievementMap = new Map(achievementDetails?.map(a => [a.id, a]) || []);

      const activities: PublicActivity[] = [];

      // Add book completion activities
      completedBooks?.forEach(book => {
        const profile = profileMap.get(book.user_id);
        if (profile) {
          activities.push({
            id: `book-${book.id}`,
            user_id: book.user_id,
            type: "book_completed",
            title: `${profile.full_name || profile.username} concluiu um livro`,
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

      // Add achievement activities
      achievements?.forEach(achievement => {
        const profile = profileMap.get(achievement.user_id);
        const achievementData = achievementMap.get(achievement.achievement_id);
        if (profile && achievementData) {
          activities.push({
            id: `achievement-${achievement.id}`,
            user_id: achievement.user_id,
            type: "achievement_unlocked",
            title: `${profile.full_name || profile.username} desbloqueou uma conquista`,
            description: `"${achievementData.title}" - ${achievementData.description}`,
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

      // Sort all activities by date
      activities.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      return activities.slice(0, 50);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook to search for public users (simplified)
export const usePublicUserSearch = (searchTerm: string) => {
  return useQuery({
    queryKey: ["public-user-search", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "user_id, username, full_name, avatar_url, bio, points, level, books_completed, total_pages_read, current_streak, longest_streak"
        )
        .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .order("points", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error searching users:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Hook to get basic profile visibility toggle (simplified)
export const useProfileVisibility = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateVisibility = useMutation({
    mutationFn: async (makePrivate: boolean) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Since is_private might not exist in current schema,
      // we'll just update a comment field for now
      const { error } = await supabase
        .from("profiles")
        .update({
          bio: makePrivate
            ? ((await getCurrentBio()) || "") + " [PRIVATE]"
            : ((await getCurrentBio()) || "").replace(" [PRIVATE]", ""),
        })
        .eq("user_id", user.id);

      if (error) throw error;
      return makePrivate;
    },
    onSuccess: isPrivate => {
      toast({
        title: "Visibilidade atualizada",
        description: isPrivate
          ? "Seu perfil foi marcado como privado"
          : "Seu perfil foi marcado como público",
      });

      queryClient.invalidateQueries({ queryKey: ["public-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["public-activity-feed"] });
    },
    onError: error => {
      toast({
        title: "Erro ao atualizar visibilidade",
        description: "Não foi possível alterar a configuração",
        variant: "destructive",
      });
    },
  });

  const getCurrentBio = async () => {
    if (!user?.id) return "";
    const { data } = await supabase.from("profiles").select("bio").eq("user_id", user.id).single();
    return data?.bio || "";
  };

  return {
    updateVisibility: updateVisibility.mutate,
    isUpdating: updateVisibility.isPending,
  };
};
