import React, { useEffect, useMemo, useState } from "react";
import { Award, Bell, Book, Flame } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell } from "@/components/layout/PageLayout";
import { useAchievements } from "@/hooks/useAchievements";
import { useAuth } from "@/hooks/useAuth";
import { useBooks } from "@/hooks/useBooks";
import { useProfile } from "@/hooks/useProfile";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import { useReadingStats } from "@/hooks/useReadingStats";
import { useFeatureFlag } from "@/lib/featureFlags";
import { EnhancedStreakDisplay } from "@/components/EnhancedStreakDisplay";
import { NotificationSettings } from "@/components/NotificationSettings";
import { ProfileManager } from "@/components/ProfileManager";
import { RetentionMetricsCard } from "@/components/RetentionMetricsCard";
import { useToast } from "@/hooks/use-toast";
import { ingestBookKnowledge } from "@/lib/bookKnowledgeApi";
import { calculateReadingPoints, formatProfileLevel } from "@/shared/utils";
import { useProfileAppearance } from "@/hooks/useProfileAppearance";
import {
  ProfileAchievementsTab,
  ProfileBooksTab,
  ProfileHero,
  ProfileStatsGrid,
  ReadingSessionsDialog,
} from "@/features/profile";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ProfilePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const retentionEnabled = useFeatureFlag("enableRetentionMetrics");
  const { bannerUrl } = useProfileAppearance(user?.id);
  const { data: readingStats } = useReadingStats(user?.id);
  const { profile, isLoading: profileLoading, updateProfile, isUpdating } = useProfile();
  const { books } = useBooks();
  const {
    achievements,
    isLoading: isLoadingAchievements,
    unlockedCount,
    totalCount,
  } = useAchievements();
  const { sessions: readingSessions, deleteSession, isDeletingSession } = useReadingSessions();

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSyncingKnowledge, setIsSyncingKnowledge] = useState(false);
  const [syncProgressText, setSyncProgressText] = useState<string | null>(null);

  const completedBooks = useMemo(
    () => books?.filter((b) => b && (b.status === "completed" || b.status === "lido")) || [],
    [books],
  );

  const readingBooks = useMemo(
    () => books?.filter((b) => b && (b.status === "reading" || b.status === "lendo")) || [],
    [books],
  );

  const wantToReadBooks = useMemo(
    () => books?.filter((b) => b && (b.status === "want-to-read" || b.status === "não lido")) || [],
    [books],
  );

  const currentYear = new Date().getFullYear();
  const completedThisYear = completedBooks.filter(
    (b) => b.date_completed && new Date(b.date_completed).getFullYear() === currentYear,
  ).length;

  const totalPages = (readingSessions || []).reduce(
    (sum, session) => sum + (session?.pages_read || 0),
    0,
  );

  const averageRating =
    completedBooks.length > 0
      ? completedBooks.reduce((sum, book) => sum + (book.rating || 0), 0) / completedBooks.length
      : 0;

  const booksWithDates = completedBooks.filter(
    (b) =>
      b.reading_started_at ||
      b.date_completed ||
      (readingSessions || []).some((session) => session.book_id === b.id),
  );

  const msPerDay = 1000 * 60 * 60 * 24;
  const averageDaysToComplete =
    booksWithDates.length > 0
      ? booksWithDates.reduce((sum, book) => {
          const sessionsForBook = (readingSessions || []).filter(
            (session) => session.book_id === book.id && session.session_date,
          );

          const sessionDateSet = new Set<string>();
          sessionsForBook.forEach((session) => {
            try {
              const date = new Date(session.session_date);
              sessionDateSet.add(date.toISOString().slice(0, 10));
            } catch (_error) {
              // ignore invalid dates
            }
          });

          let days = 0;

          if (sessionDateSet.size > 0) {
            const dates = Array.from(sessionDateSet).map((date) => new Date(date));
            const min = new Date(Math.min(...dates.map((date) => date.getTime())));
            const max = new Date(Math.max(...dates.map((date) => date.getTime())));
            const diff = Math.round((max.getTime() - min.getTime()) / msPerDay);
            days = Math.max(1, diff + 1);
          } else if (book.reading_started_at && book.date_completed) {
            const start = new Date(book.reading_started_at);
            const end = new Date(book.date_completed);
            const diff = Math.round((end.getTime() - start.getTime()) / msPerDay);
            days = Math.max(1, Math.abs(diff));
          } else {
            days = 1;
          }

          return sum + days;
        }, 0) / booksWithDates.length
      : 0;

  const sessionDateSet = new Set<string>();
  (readingSessions || []).forEach((session) => {
    if (!session?.session_date) return;

    try {
      const date = new Date(session.session_date);
      sessionDateSet.add(date.toISOString().slice(0, 10));
    } catch (_error) {
      // ignore invalid dates
    }
  });

  const daysWithSessions = sessionDateSet.size;
  const readingPace = daysWithSessions > 0 ? Math.round(totalPages / daysWithSessions) : 0;

  const displayPoints = calculateReadingPoints({
    totalPagesRead: readingStats?.total_pages_read ?? profile?.total_pages_read ?? totalPages,
    booksCompleted:
      readingStats?.books_completed ?? profile?.books_completed ?? completedBooks.length,
  });

  const displayLevel = profileLoading
    ? "Carregando..."
    : formatProfileLevel({
        total_pages_read: displayPoints,
      });

  useEffect(() => {
    if (!profile || profileLoading || isUpdating || displayLevel === "Carregando...") return;

    try {
      const storedLevel = formatProfileLevel(profile);
      if (storedLevel !== displayLevel) {
        updateProfile({
          level: displayLevel,
          points: displayPoints,
        });
      }
    } catch (_error) {
      // ignore formatting errors
    }
  }, [profile, profileLoading, isUpdating, displayLevel, displayPoints, updateProfile]);

  const selectedBookSessions = selectedBookId
    ? readingSessions?.filter((session) => session.book_id === selectedBookId) || []
    : [];

  const handleSyncBookKnowledge = async () => {
    const existingBooks = (books || []).filter((book) => book?.title?.trim());
    if (!existingBooks.length) {
      toast({
        title: "Sem livros para sincronizar",
        description: "Adicione livros na biblioteca para iniciar a indexacao.",
      });
      return;
    }

    setIsSyncingKnowledge(true);
    setSyncProgressText(`Sincronizando 0/${existingBooks.length} livros...`);

    let success = 0;
    let skipped = 0;
    let failed = 0;

    try {
      for (let i = 0; i < existingBooks.length; i += 1) {
        const book = existingBooks[i];
        setSyncProgressText(`Sincronizando ${i + 1}/${existingBooks.length}: ${book.title}`);
        try {
          const result = await ingestBookKnowledge({
            isbn: book.isbn || undefined,
            title: book.title,
            force_reingest: true,
          });
          if (result.success) {
            success += 1;
          } else if (result.skipped) {
            skipped += 1;
          } else {
            failed += 1;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (message.includes("429") || message.toLowerCase().includes("too many requests")) {
            toast({
              title: "Limite temporario da API",
              description: "O sistema esperou um pouco e vai continuar mais devagar.",
            });
            failed += 1;
            await wait(3500);
            continue;
          }
          if (message.toLowerCase().includes("sessao") || message.includes("401")) {
            toast({
              title: "Sessao expirada",
              description: "Faca login novamente para sincronizar os livros.",
              variant: "destructive",
            });
            failed += 1;
            break;
          }
          failed += 1;
        }

        if (i < existingBooks.length - 1) {
          await wait(1200);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["books", user?.id] });
      toast({
        title: "Sincronizacao concluida",
        description: `${success} sincronizado(s), ${skipped} pulado(s), ${failed} falha(s).`,
      });
    } finally {
      setIsSyncingKnowledge(false);
      setSyncProgressText(null);
    }
  };

  return (
    <PageShell containerClassName="max-w-6xl space-y-6 pb-20">
      <ProfileHero
        fullName={profile?.full_name}
        username={profile?.username}
        bio={profile?.bio}
        avatarUrl={profile?.avatar_url}
        bannerUrl={bannerUrl}
        userInitial={
          profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"
        }
        displayLevel={displayLevel}
        displayPoints={displayPoints}
        streak={profile?.current_streak || 0}
        profileLoading={profileLoading}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenSettings={() => setShowSettings(true)}
        onSyncKnowledge={() => void handleSyncBookKnowledge()}
        isSyncingKnowledge={isSyncingKnowledge}
        syncProgressText={syncProgressText}
      />

      <ProfileStatsGrid
        completedBooks={completedBooks.length}
        completedThisYear={completedThisYear}
        readingBooks={readingBooks.length}
        wantToReadBooks={wantToReadBooks.length}
        totalPages={totalPages}
        averageRating={averageRating}
        readingPace={readingPace}
        averageDaysToComplete={averageDaysToComplete}
      />

      {retentionEnabled ? <RetentionMetricsCard /> : null}

      <Tabs defaultValue="books" className="w-full">
        <TabsList className="mx-auto grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="books" className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            Livros ({completedBooks.length + readingBooks.length})
          </TabsTrigger>
          <TabsTrigger value="streak" className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Sequencia
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Conquistas ({achievements.filter((a) => a.unlocked).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="mt-6">
          <ProfileBooksTab
            readingBooks={readingBooks}
            completedBooks={completedBooks}
            onSelectBook={(bookId) => setSelectedBookId(bookId)}
          />
        </TabsContent>

        <TabsContent value="streak" className="mt-6">
          <EnhancedStreakDisplay />
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <ProfileAchievementsTab
            achievements={achievements}
            isLoading={isLoadingAchievements}
            unlockedCount={unlockedCount}
            totalCount={totalCount}
          />
        </TabsContent>
      </Tabs>

      <ReadingSessionsDialog
        open={Boolean(selectedBookId)}
        onOpenChange={(open) => {
          if (!open) setSelectedBookId(null);
        }}
        sessions={selectedBookSessions}
        isDeletingSession={isDeletingSession}
        onDeleteSession={deleteSession}
      />

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
          </DialogHeader>
          <ProfileManager />
        </DialogContent>
      </Dialog>

      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Configuracoes de notificacao
            </DialogTitle>
          </DialogHeader>
          <NotificationSettings />
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

export default ProfilePage;
