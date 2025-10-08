// Supabase Edge Function for sending daily reading reminders
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async req => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get current time
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS

    // Get users who should receive reminders at this time
    const { data: preferences, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("user_id, reminder_time")
      .eq("email_notifications_enabled", true)
      .eq("daily_reading_reminder", true);

    if (prefsError) throw prefsError;

    if (!preferences || preferences.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum usuário com lembretes habilitados" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter users whose reminder time matches current hour (allowing 1 hour window)
    const usersToNotify = preferences.filter(pref => {
      const reminderHour = parseInt(pref.reminder_time.split(":")[0]);
      const currentHour = now.getHours();
      return reminderHour === currentHour;
    });

    let queued = 0;

    for (const pref of usersToNotify) {
      // Check if user hasn't read today
      const today = new Date().toISOString().split("T")[0];
      const { data: todaySessions } = await supabase
        .from("reading_sessions")
        .select("id")
        .eq("user_id", pref.user_id)
        .gte("session_date", today)
        .limit(1);

      // Only send reminder if no reading session today
      if (!todaySessions || todaySessions.length === 0) {
        // Get user's current streak
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_streak, username")
          .eq("id", pref.user_id)
          .single();

        // Get currently reading books
        const { data: currentlyReading } = await supabase
          .from("books")
          .select("title")
          .eq("user_id", pref.user_id)
          .eq("status", "lendo")
          .order("updated_at", { ascending: false })
          .limit(1);

        // Queue notification
        await supabase.from("notification_queue").insert({
          user_id: pref.user_id,
          notification_type: "reading_reminder",
          data: {
            current_streak: profile?.current_streak || 0,
            user_name: profile?.username || "Leitor",
            currently_reading: currentlyReading?.[0]?.title || null,
          },
        });

        queued++;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Lembretes enfileirados",
        queued,
        checked: usersToNotify.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
