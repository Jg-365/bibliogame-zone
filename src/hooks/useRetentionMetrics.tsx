import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export interface RetentionMetrics {
  d1: number;
  d7: number;
  d30: number;
  activeToday: number;
  active7d: number;
  active30d: number;
}

const percent = (active: number, total: number) => {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((active / total) * 100)));
};

export const useRetentionMetrics = () =>
  useQuery({
    queryKey: ["retention-metrics"],
    queryFn: async (): Promise<RetentionMetrics> => {
      const now = new Date();
      const day1 = subDays(now, 1).toISOString();
      const day7 = subDays(now, 7).toISOString();
      const day30 = subDays(now, 30).toISOString();

      const [{ data: profiles, error: profilesError }, { data: events, error: eventsError }] =
        await Promise.all([
          supabase.from("profiles").select("user_id, created_at"),
          (supabase as any)
            .from("product_events")
            .select("user_id, created_at")
            .gte("created_at", day30),
        ]);

      if (profilesError) throw profilesError;
      if (eventsError) throw eventsError;

      const activeToday = new Set<string>();
      const active7d = new Set<string>();
      const active30d = new Set<string>();

      (events ?? []).forEach((event: { user_id: string; created_at: string }) => {
        const createdAt = new Date(event.created_at).getTime();
        const nowTime = now.getTime();
        const diffDays = Math.floor((nowTime - createdAt) / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) activeToday.add(event.user_id);
        if (diffDays <= 7) active7d.add(event.user_id);
        if (diffDays <= 30) active30d.add(event.user_id);
      });

      const cohort1 = (profiles ?? []).filter(
        (p) => new Date(p.created_at).toISOString() <= day1,
      ).length;
      const cohort7 = (profiles ?? []).filter(
        (p) => new Date(p.created_at).toISOString() <= day7,
      ).length;
      const cohort30 = (profiles ?? []).filter(
        (p) => new Date(p.created_at).toISOString() <= day30,
      ).length;

      return {
        d1: percent(activeToday.size, cohort1),
        d7: percent(active7d.size, cohort7),
        d30: percent(active30d.size, cohort30),
        activeToday: activeToday.size,
        active7d: active7d.size,
        active30d: active30d.size,
      };
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
