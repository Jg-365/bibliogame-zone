import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ReadingStatsRow {
  user_id: string;
  books_completed: number;
  total_pages_read: number;
  points: number;
}

export const useReadingStats = (userId?: string) =>
  useQuery({
    queryKey: ["reading-stats", userId],
    queryFn: async (): Promise<ReadingStatsRow | null> => {
      if (!userId) return null;
      const { data, error } = await (supabase as any)
        .from("profile_reading_stats")
        .select("user_id, books_completed, total_pages_read, points")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

export const fetchReadingStatsByUsers = async (userIds: string[]): Promise<ReadingStatsRow[]> => {
  if (!userIds.length) return [];

  const { data, error } = await (supabase as any)
    .from("profile_reading_stats")
    .select("user_id, books_completed, total_pages_read, points")
    .in("user_id", userIds);

  if (error) throw error;
  return (data ?? []) as ReadingStatsRow[];
};
