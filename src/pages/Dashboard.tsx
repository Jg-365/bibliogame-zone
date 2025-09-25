import React, { useState } from "react";
import {
  Book,
  BookOpen,
  Star,
  Trophy,
  TrendingUp,
  Award,
  LogOut,
  Plus,
  Target,
  Search,
  Users,
  Flame,
  Calendar,
  Settings,
} from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { ProgressBar } from "@/components/ProgressBar";
import { AchievementBadge } from "@/components/AchievementBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useBooks } from "@/hooks/useBooks";
import { BookSearch } from "@/components/BookSearch";
import { AchievementsPanel } from "@/components/AchievementsPanel";
import { Leaderboard } from "@/components/Leaderboard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { EnhancedDashboard } from "@/components/EnhancedDashboard";
import { BookCard } from "@/components/BookCard";
import { UserSearch } from "@/components/UserSearch";
import { ReadingSessionManager } from "@/components/ReadingSessionManager";
import { AccountResetManager } from "@/components/AccountResetManager";
import { CustomBookDialog } from "@/components/CustomBookForm";
import { DebugAchievements } from "@/components/DebugAchievements";
import heroImage from "@/assets/hero-reading.jpg";

// Level thresholds
const levelThresholds = {
  Iniciante: 0,
  Explorador: 50,
  Aventureiro: 150,
  Mestre: 300,
  Lenda: 500,
};

const getNextLevel = (currentLevel: string) => {
  const levels = Object.keys(levelThresholds);
  const currentIndex = levels.indexOf(currentLevel);
  return currentIndex < levels.length - 1
    ? levels[currentIndex + 1]
    : currentLevel;
};

const getNextLevelThreshold = (currentLevel: string) => {
  const nextLevel = getNextLevel(currentLevel);
  return levelThresholds[
    nextLevel as keyof typeof levelThresholds
  ];
};

const getPreviousLevelThreshold = (
  currentLevel: string
) => {
  return levelThresholds[
    currentLevel as keyof typeof levelThresholds
  ];
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { books } = useBooks();
  const [showBookSearch, setShowBookSearch] =
    useState(false);
  const [activeTab, setActiveTab] = useState("enhanced");

  // Safe access for profile (with default values)
  const safeProfile = profile || {
    level: "Iniciante",
    points: 0,
    books_completed: 0,
    total_pages_read: 0,
    reading_streak: 0,
    best_streak: 0,
    full_name: null,
    avatar_url: null,
  };

  const currentlyReading = books.filter(
    (book) => book.status === "reading"
  );
  const completedBooks = books.filter(
    (book) => book.status === "completed"
  );
  const wantToRead = books.filter(
    (book) => book.status === "want-to-read"
  );

  // Calculate level progress
  const currentLevel = safeProfile.level;
  const currentPoints = safeProfile.points;
  const nextLevelThreshold =
    getNextLevelThreshold(currentLevel);
  const previousLevelThreshold =
    getPreviousLevelThreshold(currentLevel);
  const levelProgress =
    currentPoints - previousLevelThreshold;
  const levelMax =
    nextLevelThreshold - previousLevelThreshold;
  const currentBook = currentlyReading[0];
  const pointsToNext = Math.max(
    0,
    nextLevelThreshold - currentPoints
  );

  // Calculate reading streak
  const readingStreak =
    (safeProfile as any).current_streak ||
    (safeProfile as any).reading_streak ||
    0;
  const bestStreak =
    (safeProfile as any).current_streak ||
    (safeProfile as any).best_streak ||
    0;

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-accent/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-primary/20 flex-shrink-0">
              <AvatarImage
                src={safeProfile.avatar_url ?? undefined}
                alt="Profile"
              />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {(
                  safeProfile.full_name ??
                  user?.email ??
                  "U"
                )
                  .charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                Olá,{" "}
                {safeProfile.full_name ??
                  user?.email?.split('@')[0] ??
                  "Usuário"}
                !
              </h1>
              <p className="text-sm text-muted-foreground">
                {safeProfile.level}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={signOut}
            size="sm"
            className="self-start sm:self-auto"
          >
            <LogOut className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-8">
          <StatsCard
            title="Livros Concluídos"
            value={completedBooks.length}
            icon={BookOpen}
            color="success"
            gradient
          />
          <StatsCard
            title="Páginas Lidas"
            value={`${Intl.NumberFormat().format(
              books.reduce(
                (total, book) =>
                  total + (book.pages_read || 0),
                0
              )
            )}`}
            icon={Book}
            color="primary"
            gradient
          />
          <StatsCard
            title="Pontos de Experiência"
            value={books.reduce(
              (total, book) =>
                total + (book.pages_read || 0),
              0
            )}
            icon={Star}
            color="accent"
            gradient
          />
          <StatsCard
            title="Nível Atual"
            value={safeProfile.level}
            icon={Award}
            color="primary"
            gradient
          />
          <StatsCard
            title="Sequência Atual"
            value={readingStreak}
            icon={Flame}
            color="accent"
          />
          <StatsCard
            title="Melhor Sequência"
            value={bestStreak}
            icon={TrendingUp}
            color="primary"
          />
        </div>

        {/* Main Navigation */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          {/* Mobile Navigation - Select Dropdown */}
          <div className="block lg:hidden">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {activeTab === "enhanced" && (
                      <>
                        <Star className="h-4 w-4" />
                        Novo
                      </>
                    )}
                    {activeTab === "overview" && (
                      <>
                        <BookOpen className="h-4 w-4" />
                        Visão Geral
                      </>
                    )}
                    {activeTab === "library" && (
                      <>
                        <Book className="h-4 w-4" />
                        Biblioteca
                      </>
                    )}
                    {activeTab === "sessions" && (
                      <>
                        <Calendar className="h-4 w-4" />
                        Sessões
                      </>
                    )}
                    {activeTab === "achievements" && (
                      <>
                        <Target className="h-4 w-4" />
                        Conquistas
                      </>
                    )}
                    {activeTab === "social" && (
                      <>
                        <Award className="h-4 w-4" />
                        Social
                      </>
                    )}
                    {activeTab === "discover" && (
                      <>
                        <Search className="h-4 w-4" />
                        Descobrir
                      </>
                    )}
                    {activeTab === "settings" && (
                      <>
                        <Settings className="h-4 w-4" />
                        Configurações
                      </>
                    )}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enhanced">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Novo
                  </div>
                </SelectItem>
                <SelectItem value="overview">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Visão Geral
                  </div>
                </SelectItem>
                <SelectItem value="library">
                  <div className="flex items-center gap-2">
                    <Book className="h-4 w-4" />
                    Biblioteca
                  </div>
                </SelectItem>
                <SelectItem value="sessions">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Sessões
                  </div>
                </SelectItem>
                <SelectItem value="achievements">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Conquistas
                  </div>
                </SelectItem>
                <SelectItem value="social">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Social
                  </div>
                </SelectItem>
                <SelectItem value="discover">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Descobrir
                  </div>
                </SelectItem>
                <SelectItem value="settings">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configurações
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Navigation - Tabs */}
          <div className="hidden lg:block">
            <TabsList className="grid w-full grid-cols-8 h-auto p-1">
              <TabsTrigger
                value="enhanced"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2"
              >
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Novo</span>
              </TabsTrigger>
              <TabsTrigger
                value="overview"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger
                value="library"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2"
              >
                <Book className="h-4 w-4" />
                <span className="hidden sm:inline">Biblioteca</span>
              </TabsTrigger>
              <TabsTrigger
                value="sessions"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Sessões</span>
              </TabsTrigger>
              <TabsTrigger
                value="achievements"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2"
              >
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Conquistas</span>
              </TabsTrigger>
              <TabsTrigger
                value="social"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2"
              >
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">Social</span>
              </TabsTrigger>
              <TabsTrigger
                value="discover"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Descobrir</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Config</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Enhanced Dashboard Tab */}
          <TabsContent value="enhanced">
            <EnhancedDashboard />
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent
            value="overview"
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Current Reading */}
              <div className="lg:col-span-2">
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Leitura Atual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {currentBook ? (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {currentBook.title}
                          </h3>
                          <p className="text-muted-foreground">
                            por {currentBook.author}
                          </p>
                        </div>
                        <ProgressBar
                          progress={currentBook.pages_read}
                          max={currentBook.total_pages}
                          label="Progresso da Leitura"
                          color="success"
                          showPercentage
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>
                            Páginas restantes:{" "}
                            {currentBook.total_pages -
                              currentBook.pages_read}
                          </span>
                          <span>
                            {Math.round(
                              (currentBook.pages_read /
                                currentBook.total_pages) *
                                100
                            )}
                            % concluído
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Nenhuma leitura em andamento
                        </p>
                        <p className="text-sm text-muted-foreground mt-2 mb-4">
                          Adicione um novo livro para
                          começar sua jornada!
                        </p>
                        <Dialog
                          open={showBookSearch}
                          onOpenChange={setShowBookSearch}
                        >
                          <DialogTrigger asChild>
                            <Button>
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar Livro
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>
                                Adicionar Novo Livro
                              </DialogTitle>
                              <DialogDescription>
                                Pesquise por livros ou
                                adicione manualmente à sua
                                biblioteca.
                              </DialogDescription>
                            </DialogHeader>
                            <BookSearch />
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {completedBooks.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Concluídos
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {currentlyReading.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Lendo
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {wantToRead.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Quero Ler
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Debug Area - Temporary */}
                <DebugAchievements />

                {/* Progress Overview */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Progresso do Nível
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ProgressBar
                      progress={levelProgress}
                      max={levelMax}
                      label={`Progresso para ${getNextLevel(
                        currentLevel
                      )}`}
                      showPercentage
                    />
                    <div className="text-sm text-muted-foreground">
                      {pointsToNext} pontos para o próximo
                      nível
                    </div>
                  </CardContent>
                </Card>

                {/* Reading Activity */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Atividade de Leitura
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        Sequência atual
                      </span>
                      <Badge variant="outline">
                        {readingStreak} dias
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        Melhor sequência
                      </span>
                      <Badge variant="outline">
                        {bestStreak} dias
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">
                        Última leitura
                      </span>
                      <Badge variant="secondary">
                        Hoje
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Dialog
                      open={showBookSearch}
                      onOpenChange={setShowBookSearch}
                    >
                      <DialogTrigger asChild>
                        <Button className="w-full bg-gradient-primary text-primary-foreground hover:shadow-glow">
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Livro
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            Adicionar Novo Livro
                          </DialogTitle>
                          <DialogDescription>
                            Pesquise por livros ou adicione
                            manualmente à sua biblioteca.
                          </DialogDescription>
                        </DialogHeader>
                        <BookSearch />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        setActiveTab("achievements")
                      }
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Ver Conquistas
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setActiveTab("social")}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Feed Social
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Library Tab */}
          <TabsContent
            value="library"
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle>
                          Minha Biblioteca
                        </CardTitle>
                        <CardDescription>
                          Gerencie sua coleção de livros e
                          acompanhe seu progresso.
                        </CardDescription>
                      </div>
                      {books.length > 0 && (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setShowBookSearch(true)
                            }
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Buscar Livro
                          </Button>
                          <CustomBookDialog />
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {books.length === 0 ? (
                      <div className="text-center py-12">
                        <Book className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium mb-2">
                          Sua biblioteca está vazia
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Adicione seu primeiro livro para
                          começar!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button
                            onClick={() =>
                              setShowBookSearch(true)
                            }
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Buscar Livro
                          </Button>
                          <CustomBookDialog />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {books.map((book) => (
                          <BookCard
                            key={book.id}
                            book={book}
                            onUpdate={() => {
                              // The updates are handled by the mutations in the BookCard
                              // No need for manual reload
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Estatísticas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {books.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total de livros
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {books.reduce(
                          (total, book) =>
                            total + (book.pages_read || 0),
                          0
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Páginas lidas
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {currentlyReading.length > 0
                          ? Math.round(
                              (currentlyReading.reduce(
                                (acc, book) =>
                                  acc +
                                  book.pages_read /
                                    book.total_pages,
                                0
                              ) /
                                currentlyReading.length) *
                                100
                            )
                          : 0}
                        %
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Progresso médio
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Reading Sessions Tab */}
          <TabsContent
            value="sessions"
            className="space-y-6"
          >
            <ReadingSessionManager />
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent
            value="achievements"
            className="space-y-6"
          >
            <AchievementsPanel />
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-6">
            {activeTab === "social" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <ActivityFeed />
                </div>
                <div className="space-y-6">
                  <UserSearch />
                  <Leaderboard />
                </div>
              </div>
            )}
          </TabsContent>

          {/* Discover Tab */}
          <TabsContent
            value="discover"
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Descobrir Novos Livros
                </CardTitle>
                <CardDescription>
                  Encontre seu próximo livro favorito
                  pesquisando nossa base de dados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeTab === "discover" && <BookSearch />}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent
            value="settings"
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações da Conta
                </CardTitle>
                <CardDescription>
                  Gerencie suas configurações e dados da
                  conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AccountResetManager />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
