import { supabase } from "@/integrations/supabase/client";

interface TrackEventInput {
  userId?: string;
  eventName: string;
  eventCategory?: string;
  payload?: Record<string, unknown>;
}

export const trackEvent = async ({
  userId,
  eventName,
  eventCategory,
  payload = {},
}: TrackEventInput) => {
  if (!userId) return;

  try {
    await (supabase as any).from("product_events").insert({
      user_id: userId,
      event_name: eventName,
      event_category: eventCategory ?? null,
      payload,
    });
  } catch (_error) {
    // Observability must never break primary UX flows.
  }
};
