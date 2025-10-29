import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useBooks } from "@/hooks/useBooks";
import { useAchievements } from "@/hooks/useAchievements";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Book,
  BookOpen,
  Target,
  Star,
  TrendingUp,
  Calendar,
  Trophy,
  Flame,
  Settings,
  Award,
  Clock,
  BarChart3,
  Bell,
  Trash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatProfileLevel } from "@/shared/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ProfileManager } from "@/components/ProfileManager";
import { EnhancedStreakDisplay } from "@/components/EnhancedStreakDisplay";
import { NotificationSettings } from "@/components/NotificationSettings";
import { motion, AnimatePresence } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  className,
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card
      className={cn(
        "hover:shadow-lg transition-all",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={cn("text-xs", getTrendColor())}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

const ProfilePage = () => {
  const { user } = useAuth();
  const {
    profile,
    isLoading: profileLoading,
    updateProfile,
    isUpdating,
  } = useProfile();
  const { books } = useBooks();
  const {
    achievements,
    isLoading: isLoadingAchievements,
    unlockedCount,
    totalCount,
  } = useAchievements();
  const [selectedBook, setSelectedBook] = useState<
    string | null
  >(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] =
    useState(false);
  const {
    sessions: readingSessions,
    deleteSession,
    isDeletingSession,
  } = useReadingSessions();
  const { toast } = useToast();

  // Calcular estatísticas
  // Accept both Portuguese and English status values (e.g. 'lido' / 'completed')
  const completedBooks =
    books?.filter(
      (b) =>
        b &&
        (b.status === "completed" || b.status === "lido")
    ) || [];
  const readingBooks =
    books?.filter(
      (b) =>
        b &&
        (b.status === "reading" || b.status === "lendo")
    ) || [];
  const wantToReadBooks =
    books?.filter(
      (b) =>
        b &&
        (b.status === "want-to-read" ||
          b.status === "não lido")
    ) || [];

  const currentYear = new Date().getFullYear();
  const completedThisYear = completedBooks.filter(
    (b) =>
      b.date_completed &&
      new Date(b.date_completed).getFullYear() ===
        currentYear
  ).length;

  // Total de páginas lidas: sum of reading sessions (more accurate than total_pages)
  const totalPages = (readingSessions || []).reduce(
    (sum, s) => sum + (s?.pages_read || 0),
    0
  );

  const averageRating =
    completedBooks.length > 0
      ? completedBooks.reduce(
          (sum, book) => sum + (book.rating || 0),
          0
        ) / completedBooks.length
      : 0;

  // Calcular tempo médio para terminar um livro (dias)
  // Calcular tempo médio para terminar um livro (dias)
  // Use sessões de leitura quando disponíveis (mais preciso). Para cada livro concluído,
  // calculamos a diferença entre a primeira e última sessão (dias de calendário) — caso não
  // haja sessões, caímos para o intervalo entre reading_started_at e date_completed.
  const booksWithDates = completedBooks.filter(
    (b) =>
      b.reading_started_at ||
      b.date_completed ||
      (readingSessions || []).some(
        (s) => s.book_id === b.id
      )
  );

  const msPerDay = 1000 * 60 * 60 * 24;

  const averageDaysToComplete =
    booksWithDates.length > 0
      ? booksWithDates.reduce((sum, book) => {
          // Gather session dates for this book (YYYY-MM-DD)
          const sessionsForBook = (
            readingSessions || []
          ).filter(
            (s) => s.book_id === book.id && s.session_date
          );
          const sessionDateSet = new Set<string>();
          sessionsForBook.forEach((s) => {
            try {
              const d = new Date(s.session_date);
              sessionDateSet.add(
                d.toISOString().slice(0, 10)
              );
            } catch (e) {
              // ignore invalid dates
            }
          });

          let days = 0;

          if (sessionDateSet.size > 0) {
            const dates = Array.from(sessionDateSet).map(
              (d) => new Date(d)
            );
            const min = new Date(
              Math.min(...dates.map((d) => d.getTime()))
            );
            const max = new Date(
              Math.max(...dates.map((d) => d.getTime()))
            );
            // inclusive days: difference in days + 1
            const diff = Math.round(
              (max.getTime() - min.getTime()) / msPerDay
            );
            days = Math.max(1, diff + 1);
          } else if (
            book.reading_started_at &&
            book.date_completed
          ) {
            const start = new Date(
              book.reading_started_at!
            );
            const end = new Date(book.date_completed!);
            const diff = Math.round(
              (end.getTime() - start.getTime()) / msPerDay
            );
            days = Math.max(1, Math.abs(diff));
          } else {
            // fallback to 1 day if we have no dates
            days = 1;
          }

          return sum + days;
        }, 0) / booksWithDates.length
      : 0;

  // Ritmo de leitura (páginas por dia) — use distinct session dates to compute days active
  const sessionDateSet = new Set<string>();
  (readingSessions || []).forEach((s) => {
    if (!s || !s.session_date) return;
    try {
      const d = new Date(s.session_date);
      sessionDateSet.add(d.toISOString().slice(0, 10));
    } catch (e) {
      // ignore invalid dates
    }
  });
  const daysWithSessions = sessionDateSet.size;
  const readingPace =
    daysWithSessions > 0
      ? Math.round(totalPages / daysWithSessions)
      : 0;

  const unlockedAchievements =
    achievements?.filter((a) => a.unlocked) || [];

  // Display points: prefer profile.points, then profile.total_pages_read, then live session sum
  const displayPoints =
    (profile &&
      (profile.points ?? profile.total_pages_read)) ||
    totalPages ||
    0;

  // Compute a level based on the canonical formatter but prefer live-derived points
  // Compute display level based on the live-derived points. Intentionally do NOT
  // pass through the stored `profile.level` here so the UI reflects current
  // pages/points (stored level can be stale). We only pass `total_pages_read`.
  const displayLevel = profileLoading
    ? "Carregando..."
    : formatProfileLevel({
        total_pages_read: displayPoints,
      });

  // Auto-sync derived level/points back to DB when different from stored values.
  // Guarded to avoid update loops: only run when profile is loaded, not currently updating,
  // and when the canonical formatted level differs.
  useEffect(() => {
    if (
      !profile ||
      profileLoading ||
      isUpdating ||
      displayLevel === "Carregando..."
    )
      return;

    try {
      const storedLevel = formatProfileLevel(profile);
      if (storedLevel !== displayLevel) {
        console.log(
          "🔁 Sincronizando nível derivado com o banco:",
          { from: storedLevel, to: displayLevel }
        );
        // updateProfile is the mutate function from the hook
        updateProfile({
          level: displayLevel,
          points: displayPoints,
        });
      }
    } catch (e) {
      // ignore formatting errors
      console.error(
        "Erro ao sincronizar nível do perfil:",
        e
      );
    }
    // We only want to run when relevant inputs change
  }, [
    profile,
    profileLoading,
    isUpdating,
    displayLevel,
    displayPoints,
    updateProfile,
  ]);

  // Filtrar sessões do livro selecionado
  const selectedBookSessions = selectedBook
    ? readingSessions?.filter(
        (s) => s.book_id === selectedBook
      ) || []
    : [];

  // Função para converter nomes de ícones em emojis
  const getAchievementIcon = (icon: string) => {
    // Return a lucide-react icon component for consistent rendering
    switch (icon) {
      case "Star":
        return <Star className="h-6 w-6 text-yellow-500" />;
      case "Trophy":
        return (
          <Trophy className="h-6 w-6 text-amber-500" />
        );
      case "Award":
        return <Award className="h-6 w-6 text-slate-700" />;
      case "Book":
        return <Book className="h-6 w-6 text-green-600" />;
      case "Books":
        return (
          <BookOpen className="h-6 w-6 text-green-600" />
        );
      case "Flame":
      case "Fire":
        return (
          <Flame className="h-6 w-6 text-orange-500" />
        );
      case "Target":
        return <Target className="h-6 w-6 text-blue-500" />;
      case "Runner":
        return (
          <TrendingUp className="h-6 w-6 text-green-500" />
        );
      case "Page":
        return (
          <BookOpen className="h-6 w-6 text-muted-foreground" />
        );
      case "Sparkle":
      case "Starburst":
        return <Star className="h-6 w-6 text-yellow-300" />;
      case "Rocket":
        return (
          <TrendingUp className="h-6 w-6 text-purple-500" />
        );
      default:
        return (
          <Award className="h-6 w-6 text-muted-foreground" />
        );
    }
  };

  // Use shared helper to format/derive level consistently

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header com avatar e info */}
        <Card className="overflow-hidden">
          <div className="h-24 sm:h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 sm:-mt-16">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-xl">
                <AvatarImage
                  src={profile?.avatar_url || ""}
                />
                <AvatarFallback className="text-2xl sm:text-4xl font-bold">
                  {profile?.full_name
                    ?.charAt(0)
                    .toUpperCase() ||
                    user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">
                      {profile?.full_name || "Seu Perfil"}
                    </h1>
                    {profile?.username && (
                      <p className="text-muted-foreground">
                        @{profile.username}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setShowNotifications(true)
                      }
                      className="self-start sm:self-auto"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Notificações
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSettings(true)}
                      className="self-start sm:self-auto"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Editar Perfil
                    </Button>
                  </div>
                </div>

                {profile?.bio && (
                  <p className="text-sm text-muted-foreground">
                    {profile.bio}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Trophy className="h-3 w-3" />
                    {displayLevel}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Star className="h-3 w-3 text-yellow-500" />
                    {profileLoading ? "—" : displayPoints}{" "}
                    pontos
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <Flame className="h-3 w-3 text-orange-500" />
                    {profileLoading
                      ? "—"
                      : profile?.current_streak || 0}{" "}
                    dias
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            title="Livros Lidos"
            value={completedBooks.length}
            description={`${completedThisYear} este ano`}
            icon={<Book className="h-4 w-4" />}
            trend="up"
          />
          <StatCard
            title="Lendo Agora"
            value={readingBooks.length}
            description={`${wantToReadBooks.length} na lista`}
            icon={<BookOpen className="h-4 w-4" />}
            trend="neutral"
          />
          <StatCard
            title="Páginas Lidas"
            value={
              totalPages >= 1000
                ? `${(totalPages / 1000).toFixed(1)}k`
                : totalPages
            }
            description="Total acumulado"
            icon={<Target className="h-4 w-4" />}
            trend="up"
          />
          <StatCard
            title="Avaliação Média"
            value={
              averageRating > 0
                ? averageRating.toFixed(1)
                : "—"
            }
            description="Suas avaliações"
            icon={<Star className="h-4 w-4" />}
            trend="neutral"
          />
          <StatCard
            title="Ritmo de Leitura"
            value={readingPace > 0 ? readingPace : "—"}
            description="páginas/dia"
            icon={<BarChart3 className="h-4 w-4" />}
            trend="neutral"
          />
          <StatCard
            title="Tempo Médio"
            value={
              averageDaysToComplete > 0
                ? Math.round(averageDaysToComplete)
                : "—"
            }
            description="dias/livro"
            icon={<Clock className="h-4 w-4" />}
            trend="neutral"
          />
        </div>

        {/* Tabs: Livros, Sequência e Conquistas */}
        <Tabs defaultValue="books" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto">
            <TabsTrigger
              value="books"
              className="flex items-center gap-2"
            >
              <Book className="h-4 w-4" />
              Livros (
              {completedBooks.length + readingBooks.length})
            </TabsTrigger>
            <TabsTrigger
              value="streak"
              className="flex items-center gap-2"
            >
              <Flame className="h-4 w-4" />
              Sequência
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="flex items-center gap-2"
            >
              <Award className="h-4 w-4" />
              Conquistas ({unlockedAchievements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="books" className="mt-6">
            {completedBooks.length > 0 ||
            readingBooks.length > 0 ? (
              <div className="space-y-6">
                {/* Livros que está lendo */}
                {readingBooks.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">
                        Lendo Agora ({readingBooks.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                      {readingBooks.map((book) => (
                        <motion.div
                          key={book.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="cursor-pointer"
                          onClick={() =>
                            setSelectedBook(book.id)
                          }
                        >
                          <Card className="overflow-hidden hover:shadow-xl transition-all border-2 border-primary/50">
                            <div className="aspect-[2/3] relative bg-muted">
                              {book.cover_url ? (
                                <img
                                  src={book.cover_url}
                                  alt={book.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                              <Badge className="absolute top-2 right-2 bg-primary">
                                <BookOpen className="h-3 w-3 mr-1" />
                                Lendo
                              </Badge>
                              {book.total_pages > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1">
                                  {Math.round(
                                    (book.pages_read /
                                      book.total_pages) *
                                      100
                                  )}
                                  %
                                </div>
                              )}
                            </div>
                            <CardContent className="p-2">
                              <h3 className="font-semibold text-xs truncate">
                                {book.title}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate">
                                {book.author}
                              </p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Livros concluídos */}
                {completedBooks.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Book className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold">
                        Concluídos ({completedBooks.length})
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                      {completedBooks.map((book) => (
                        <motion.div
                          key={book.id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="cursor-pointer"
                          onClick={() =>
                            setSelectedBook(book.id)
                          }
                        >
                          <Card className="overflow-hidden hover:shadow-xl transition-all">
                            <div className="aspect-[2/3] relative bg-muted">
                              {book.cover_url ? (
                                <img
                                  src={book.cover_url}
                                  alt={book.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Book className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                              {book.rating && (
                                <Badge className="absolute top-2 right-2 bg-yellow-500">
                                  <Star className="h-3 w-3 mr-1" />
                                  {book.rating}
                                </Badge>
                              )}
                            </div>
                            <CardContent className="p-2">
                              <h3 className="font-semibold text-xs truncate">
                                {book.title}
                              </h3>
                              <p className="text-xs text-muted-foreground truncate">
                                {book.author}
                              </p>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  Nenhum livro
                </h3>
                <p className="text-sm text-muted-foreground">
                  Comece a ler e seus livros aparecerão
                  aqui!
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="streak" className="mt-6">
            <EnhancedStreakDisplay />
          </TabsContent>

          <TabsContent
            value="achievements"
            className="mt-6"
          >
            {isLoadingAchievements ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-slate-200 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                          <div className="h-3 bg-slate-200 rounded w-full"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : achievements && achievements.length > 0 ? (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {unlockedCount} de {totalCount}{" "}
                    conquistas desbloqueadas
                  </p>
                </div>

                {/* Conquistas Desbloqueadas */}
                {unlockedAchievements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      Desbloqueadas (
                      {unlockedAchievements.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {unlockedAchievements.map(
                        (achievement) => (
                          <Card
                            key={achievement.id}
                            className="hover:shadow-lg transition-all border-amber-200 bg-amber-50/50"
                          >
                            <CardContent className="p-4 flex items-start gap-3">
                              <div className="text-4xl">
                                {getAchievementIcon(
                                  achievement.icon
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold">
                                  {achievement.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {achievement.description}
                                </p>
                                {achievement.unlockedAt && (
                                  <p className="text-xs text-amber-600 mt-1 font-medium">
                                    ✓{" "}
                                    {format(
                                      new Date(
                                        achievement.unlockedAt
                                      ),
                                      "dd/MM/yyyy",
                                      {
                                        locale: ptBR,
                                      }
                                    )}
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Conquistas Bloqueadas */}
                {achievements.filter((a) => !a.unlocked)
                  .length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                      <Award className="h-5 w-5" />
                      Bloqueadas (
                      {
                        achievements.filter(
                          (a) => !a.unlocked
                        ).length
                      }
                      )
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {achievements
                        .filter((a) => !a.unlocked)
                        .map((achievement) => (
                          <Card
                            key={achievement.id}
                            className="hover:shadow-lg transition-all opacity-60"
                          >
                            <CardContent className="p-4 flex items-start gap-3">
                              <div className="text-4xl grayscale">
                                {getAchievementIcon(
                                  achievement.icon
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-muted-foreground">
                                  {achievement.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {achievement.description}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  🔒{" "}
                                  {achievement.requirementType ===
                                  "books_read"
                                    ? `Leia ${
                                        achievement.requirementValue
                                      } ${
                                        achievement.requirementValue ===
                                        1
                                          ? "livro"
                                          : "livros"
                                      }`
                                    : achievement.requirementType ===
                                        "pages_read"
                                      ? `Leia ${achievement.requirementValue} páginas`
                                      : `${achievement.requirementValue} ${achievement.requirementType}`}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  Nenhuma conquista disponível
                </h3>
                <p className="text-sm text-muted-foreground">
                  As conquistas aparecerão em breve!
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Sessões de Leitura */}
      <Dialog
        open={!!selectedBook}
        onOpenChange={() => setSelectedBook(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Sessões de Leitura
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            {selectedBookSessions &&
            selectedBookSessions.length > 0 ? (
              <AnimatePresence>
                {selectedBookSessions.map(
                  (session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                {format(
                                  new Date(
                                    session.session_date
                                  ),
                                  "dd/MM/yyyy 'às' HH:mm",
                                  {
                                    locale: ptBR,
                                  }
                                )}
                              </div>

                              <div className="flex items-center gap-4">
                                <Badge variant="secondary">
                                  {session.pages_read}{" "}
                                  páginas lidas
                                </Badge>
                              </div>

                              {session.notes && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {session.notes}
                                </p>
                              )}
                            </div>

                            <div className="flex items-start gap-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const ok = window.confirm(
                                    "Remover esta sessão de leitura? Esta ação atualizará o livro e removerá as páginas registradas."
                                  );
                                  if (!ok) return;
                                  deleteSession(
                                    session.id as any
                                  );
                                }}
                                disabled={isDeletingSession}
                                className="ml-2"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                )}
              </AnimatePresence>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>
                  Nenhuma sessão de leitura registrada para
                  este livro.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Configurações */}
      <Dialog
        open={showSettings}
        onOpenChange={setShowSettings}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ProfileManager />
        </DialogContent>
      </Dialog>

      {/* Dialog de Notificações */}
      <Dialog
        open={showNotifications}
        onOpenChange={setShowNotifications}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Configurações de Notificação
            </DialogTitle>
          </DialogHeader>
          <NotificationSettings />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
