import { Book, BookOpen, Star, Trophy, TrendingUp, Award, LogOut, Plus, Target } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { ProgressBar } from "@/components/ProgressBar";
import { AchievementBadge } from "@/components/AchievementBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useBooks } from "@/hooks/useBooks";
import heroImage from "@/assets/hero-reading.jpg";

// Level thresholds
const levelThresholds = {
  "Iniciante": 0,
  "Explorador": 50,
  "Aventureiro": 150,
  "Mestre": 300,
  "Lenda": 500
};

const getNextLevel = (currentLevel: string) => {
  const levels = Object.keys(levelThresholds);
  const currentIndex = levels.indexOf(currentLevel);
  return levels[currentIndex + 1] || currentLevel;
};

const getNextLevelThreshold = (currentLevel: string) => {
  const nextLevel = getNextLevel(currentLevel);
  return levelThresholds[nextLevel as keyof typeof levelThresholds] || 1000;
};

const getPreviousLevelThreshold = (currentLevel: string) => {
  return levelThresholds[currentLevel as keyof typeof levelThresholds] || 0;
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { books } = useBooks();

  const currentlyReading = books.filter(book => book.status === "reading");
  const completedBooks = books.filter(book => book.status === "completed");
  
  // Calculate level progress
  const currentLevel = profile?.level || "Iniciante";
  const currentPoints = profile?.points || 0;
  const nextLevelThreshold = getNextLevelThreshold(currentLevel);
  const previousLevelThreshold = getPreviousLevelThreshold(currentLevel);
  const levelProgress = currentPoints - previousLevelThreshold;
  const levelMax = nextLevelThreshold - previousLevelThreshold;

  const currentBook = currentlyReading[0];
  const pointsToNext = Math.max(0, nextLevelThreshold - currentPoints);

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-sm border-b border-border/50 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">ReadQuest</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold text-foreground">{profile?.full_name || user?.email}</p>
                <p className="text-sm text-muted-foreground">{profile?.level || "Iniciante"}</p>
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {(profile?.full_name || user?.email || "U").split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative mb-8 rounded-2xl overflow-hidden shadow-glow">
          <div 
            className="h-64 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${heroImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-primary/80 flex items-center">
              <div className="container mx-auto px-8">
                <div className="text-white max-w-2xl">
                  <h2 className="text-4xl font-bold mb-4">
                    Continue sua jornada de leitura
                  </h2>
                  <p className="text-lg opacity-90 mb-6">
                    Você está fazendo um ótimo progresso! Continue lendo para ganhar mais pontos.
                  </p>
                  {pointsToNext > 0 && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                      <p className="text-sm mb-2">Próximo nível em: {pointsToNext} pontos</p>
                      <ProgressBar 
                        progress={levelProgress} 
                        max={levelMax}
                        color="accent"
                        showPercentage
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Livros Completos"
            value={profile?.books_completed || 0}
            icon={Book}
            color="primary"
            gradient
          />
          <StatsCard
            title="Páginas Lidas"
            value={(profile?.total_pages_read || 0).toLocaleString()}
            icon={BookOpen}
            color="success"
            gradient
          />
          <StatsCard
            title="Pontos Totais"
            value={profile?.points || 0}
            icon={Star}
            color="accent"
            gradient
          />
          <StatsCard
            title="Nível Atual"
            value={profile?.level || "Iniciante"}
            icon={Trophy}
          />
        </div>

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
                      <h3 className="font-semibold text-lg">{currentBook.title}</h3>
                      <p className="text-muted-foreground">por {currentBook.author}</p>
                    </div>
                    <ProgressBar
                      progress={currentBook.pages_read}
                      max={currentBook.total_pages}
                      label="Progresso da Leitura"
                      color="success"
                      showPercentage
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Páginas restantes: {currentBook.total_pages - currentBook.pages_read}</span>
                      <span>
                        {Math.round((currentBook.pages_read / currentBook.total_pages) * 100)}% concluído
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma leitura em andamento</p>
                    <p className="text-sm text-muted-foreground mt-2 mb-4">
                      Adicione um novo livro para começar sua jornada!
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Livro
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card className="shadow-card mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-accent" />
                  Conquistas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <AchievementBadge
                    title="Primeiro Livro"
                    description="Complete seu primeiro livro"
                    icon={Trophy}
                    unlocked={completedBooks.length >= 1}
                    rarity="common"
                  />
                  <AchievementBadge
                    title="Leitor Dedicado"
                    description="Complete 5 livros"
                    icon={Award}
                    unlocked={completedBooks.length >= 5}
                    rarity="rare"
                  />
                  <AchievementBadge
                    title="Bibliófilo"
                    description="Complete 10 livros"
                    icon={Star}
                    unlocked={completedBooks.length >= 10}
                    rarity="epic"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Overview */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Progresso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProgressBar 
                  progress={levelProgress} 
                  max={levelMax} 
                  label={`Progresso para ${getNextLevel(currentLevel)}`}
                  showPercentage
                />
                
                {currentlyReading.slice(1).map(book => (
                  <div key={book.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{book.title}</span>
                      <Badge variant="secondary">Lendo</Badge>
                    </div>
                    <ProgressBar 
                      progress={book.pages_read} 
                      max={book.total_pages}
                      showPercentage
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-gradient-primary text-primary-foreground hover:shadow-glow">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Livro
                </Button>
                <Button variant="outline" className="w-full">
                  <Target className="h-4 w-4 mr-2" />
                  Atualizar Progresso
                </Button>
                <Button variant="ghost" className="w-full">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Ver Biblioteca
                </Button>
              </CardContent>
            </Card>

            {/* Coming Soon */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Ranking Global
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Em breve!</p>
                  <p className="text-xs mt-1">Ranking será implementado quando tivermos mais usuários.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;