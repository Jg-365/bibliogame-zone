import { Book, BookOpen, Star, Trophy, TrendingUp, Award } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { ProgressBar } from "@/components/ProgressBar";
import { AchievementBadge } from "@/components/AchievementBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockUser, mockBooks, mockAchievements, mockRanking, getPointsForNextLevel } from "@/data/mockData";
import heroImage from "@/assets/hero-reading.jpg";

const Dashboard = () => {
  const currentBook = mockBooks.find(book => book.status === "reading");
  const recentAchievements = mockAchievements.filter(ach => ach.unlocked).slice(0, 3);
  const topRanking = mockRanking.slice(0, 3);
  const pointsToNext = getPointsForNextLevel(mockUser.points);

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="bg-card shadow-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                ReadQuest
              </h1>
              <p className="text-muted-foreground mt-1">Transforme sua leitura em aventura</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-gradient-gold text-accent-foreground shadow-gold">
                {mockUser.level}
              </Badge>
              <div className="text-right">
                <p className="font-semibold">{mockUser.name}</p>
                <p className="text-sm text-muted-foreground">{mockUser.points} pontos</p>
              </div>
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
                      <p className="text-sm mb-2">Próximo nível em:</p>
                      <ProgressBar 
                        progress={mockUser.points} 
                        max={mockUser.points + pointsToNext}
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
            value={mockUser.booksCompleted}
            icon={Book}
            color="primary"
            gradient
          />
          <StatsCard
            title="Páginas Lidas"
            value={mockUser.totalPagesRead.toLocaleString()}
            icon={BookOpen}
            color="success"
            gradient
          />
          <StatsCard
            title="Pontos Totais"
            value={mockUser.points}
            icon={Star}
            color="accent"
            gradient
          />
          <StatsCard
            title="Ranking Global"
            value="#1"
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
                      progress={currentBook.pagesRead}
                      max={currentBook.totalPages}
                      label="Progresso da Leitura"
                      color="success"
                      showPercentage
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Páginas restantes: {currentBook.totalPages - currentBook.pagesRead}</span>
                      <span>
                        {Math.round((currentBook.pagesRead / currentBook.totalPages) * 100)}% concluído
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma leitura em andamento</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Adicione um novo livro para começar!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card className="shadow-card mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-accent" />
                  Conquistas Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAchievements.map((achievement) => (
                    <AchievementBadge
                      key={achievement.id}
                      title={achievement.title}
                      description={achievement.description}
                      icon={Award}
                      unlocked={achievement.unlocked}
                      rarity={achievement.rarity}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Readers */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Top Leitores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topRanking.map((user, index) => (
                    <div key={user.id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? "bg-gradient-gold text-accent-foreground" :
                        index === 1 ? "bg-muted text-muted-foreground" :
                        "bg-secondary text-secondary-foreground"
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${user.id === mockUser.id ? "text-primary" : ""}`}>
                          {user.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.points} pontos • {user.booksCompleted} livros
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button className="w-full bg-gradient-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:shadow-glow transition-all duration-300">
                  + Adicionar Livro
                </button>
                <button className="w-full bg-gradient-success text-success-foreground py-2 px-4 rounded-lg font-medium hover:shadow-glow transition-all duration-300">
                  Atualizar Progresso
                </button>
                <button className="w-full border border-border py-2 px-4 rounded-lg font-medium hover:bg-secondary transition-colors">
                  Ver Biblioteca
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;