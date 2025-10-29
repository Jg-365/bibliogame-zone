import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatProfileLevel } from "@/shared/utils";

export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      // Get user profile
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select(
            `
          user_id,
          username,
          full_name,
          avatar_url,
          bio,
          created_at,
          current_streak
        `
          )
          .eq("user_id", userId)
          .single();

      if (profileError) throw profileError;

      // Get user's books
      const { data: books, error: booksError } =
        await supabase
          .from("books")
          .select(
            `
          id,
          title,
          author,
          cover_url,
          status,
          pages_read,
          total_pages,
          rating,
          created_at,
          updated_at
        `
          )
          .eq("user_id", userId)
          .order("updated_at", { ascending: false });

      if (booksError) throw booksError;

      // Get user's achievements
      const {
        data: userAchievements,
        error: achievementsError,
      } = await supabase
        .from("user_achievements")
        .select(
          `
          id,
          achievement_id,
          unlocked_at,
          achievements!inner (
            id,
            title,
            description,
            icon,
            rarity,
            requirement_type,
            requirement_value
          )
        `
        )
        .eq("user_id", userId)
        .order("unlocked_at", { ascending: false });

      if (achievementsError) throw achievementsError;

      // Calculate stats
      const completedBooks =
        books?.filter(
          (book) => book.status === "completed"
        ) || [];
      const currentlyReading =
        books?.filter(
          (book) => book.status === "reading"
        ) || [];
      const totalPagesRead =
        books?.reduce(
          (sum, book) => sum + (book.pages_read || 0),
          0
        ) || 0;

      // Determine level using shared helper for consistency
      const level = formatProfileLevel({
        total_pages_read: totalPagesRead,
      });

      return {
        profile,
        books: books || [],
        achievements: userAchievements || [],
        stats: {
          completedBooks: completedBooks.length,
          currentlyReading: currentlyReading.length,
          totalPagesRead,
          totalAchievements: userAchievements?.length || 0,
          level,
          points: totalPagesRead, // 1 point per page
          currentStreak: profile?.current_streak || 0,
        },
      };
    },
    enabled: !!userId,
  });
};
