import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const DebugStatsButton = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleManualStatsUpdate = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current books count and pages for this user
      const { data: booksData, error: booksError } = await supabase
        .from("books")
        .select("status, pages_read")
        .eq("user_id", user.id);

      if (booksError) throw booksError;

      const completedBooks = booksData?.filter(book => book.status === "completed").length || 0;
      const totalPagesRead = booksData?.reduce((sum, book) => sum + (book.pages_read || 0), 0) || 0;

      // Manual update of profile stats
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          books_completed: completedBooks,
          total_pages_read: totalPagesRead,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Get updated profile to show current state
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("books_completed, total_pages_read")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      toast({
        title: "Stats atualizados manualmente!",
        description: `Livros: ${profile.books_completed}, Páginas: ${profile.total_pages_read}`,
      });

      // Force refresh of profile data
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar stats",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleManualStreakUpdate = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if user has reading sessions today
      const today = new Date().toISOString().split("T")[0];

      const { data: todaySessions, error: sessionsError } = await supabase
        .from("reading_sessions")
        .select("pages_read")
        .eq("user_id", user.id)
        .gte("session_date", `${today}T00:00:00Z`)
        .lt("session_date", `${today}T23:59:59Z`);

      if (sessionsError) throw sessionsError;

      const hasReadToday =
        todaySessions &&
        todaySessions.length > 0 &&
        todaySessions.some(session => session.pages_read > 0);

      // Get current profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError) throw profileError;

      let newStreak = (profile as any).current_streak || 0;
      let newBestStreak = (profile as any).longest_streak || 0;

      if (hasReadToday) {
        const lastActivity = (profile as any).last_activity_date
          ? new Date((profile as any).last_activity_date).toISOString().split("T")[0]
          : null;

        if (lastActivity !== today) {
          // Calculate streak logic
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0];

          if (lastActivity === yesterdayStr || newStreak === 0) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }

          if (newStreak > newBestStreak) {
            newBestStreak = newStreak;
          }
        }
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          current_streak: newStreak,
          longest_streak: newBestStreak,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast({
        title: "Streak atualizado manualmente!",
        description: `Streak atual: ${newStreak} dias, Melhor: ${newBestStreak} dias`,
      });

      // Force refresh
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar streak",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex gap-2 p-4">
      <Button onClick={handleManualStatsUpdate} variant="outline">
        Atualizar Stats Manualmente
      </Button>
      <Button onClick={handleManualStreakUpdate} variant="outline">
        Atualizar Streak Manualmente
      </Button>
    </div>
  );
};
