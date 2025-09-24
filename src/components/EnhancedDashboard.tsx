import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Search,
  BookOpen,
  Calendar,
  Trophy,
  Settings,
  Plus,
  TrendingUp,
} from "lucide-react";
import { ProfileManager } from "@/components/ProfileManager";
import { UserSearch } from "@/components/UserSearch";
import { ReadingCalendar } from "@/components/ReadingCalendar";
import { AchievementsPanel } from "@/components/AchievementsPanel";
import { useProfile } from "@/hooks/useProfile";
import { useBooks } from "@/hooks/useBooks";
import { useAchievements } from "@/hooks/useAchievements";

export const EnhancedDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showProfileManager, setShowProfileManager] =
    useState(false);
  const [showUserSearch, setShowUserSearch] =
    useState(false);

  const { profile } = useProfile();
  const { books } = useBooks();
  const { unlockedCount, totalCount } = useAchievements();

  const inProgressBooks = books.filter(
    (book) => book.status === "reading"
  );
  const currentBook =
    inProgressBooks[0] ||
    books.find(
      (book) => book.id === profile?.current_book_id
    );
  const completedBooks = books.filter(
    (book) => book.status === "completed"
  );

  const totalPagesRead = books.reduce(
    (total, book) => total + (book.pages_read || 0),
    0
  );

  const stats = [
    {
      title: "Livros Lidos",
      value: completedBooks.length,
      icon: BookOpen,
      color: "text-blue-600",
    },
    {
      title: "Em Progresso",
      value: inProgressBooks.length,
      icon: TrendingUp,
      color: "text-orange-600",
    },
    {
      title: "Conquistas",
      value: `${unlockedCount}/${totalCount}`,
      icon: Trophy,
      color: "text-yellow-600",
    },
    {
      title: "Sequência",
      value: `${profile?.current_streak || 0} dias`,
      icon: Calendar,
      color: "text-green-600",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Olá, {profile?.username || "Leitor"}! 📚
          </h1>
          <p className="text-gray-600">
            Bem-vindo ao seu painel de leitura personalizado
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowUserSearch(true)}
          >
            <Search className="h-4 w-4 mr-2" />
            Buscar Usuários
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowProfileManager(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Perfil
          </Button>
        </div>
      </div>

      {/* Current Book Highlight */}
      {currentBook && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <BookOpen className="h-5 w-5" />
              Livro Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">
                  {currentBook.title}
                </h3>
                <p className="text-sm text-blue-700">
                  por {currentBook.author}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {currentBook.pages_read} de{" "}
                  {currentBook.total_pages} páginas
                </p>
              </div>
              <div className="text-right">
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-800"
                >
                  {Math.round(
                    (currentBook.pages_read /
                      currentBook.total_pages) *
                      100
                  )}
                  %
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="p-4">
              <div
                className={`inline-flex p-2 rounded-lg bg-gray-100 ${stat.color} mb-2`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600">
                {stat.title}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="calendar">
            Calendário
          </TabsTrigger>
          <TabsTrigger value="achievements">
            Conquistas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Books */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Livros Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {books.slice(0, 3).map((book) => (
                    <div
                      key={book.id}
                      className="border rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {book.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {book.author}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={
                                book.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {book.status === "completed"
                                ? "Concluído"
                                : "Lendo"}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {book.pages_read}/
                              {book.total_pages} páginas
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {books.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      Nenhum livro encontrado. Adicione seu
                      primeiro livro!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reading Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progresso de Leitura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Total de Páginas Lidas</span>
                      <span>{totalPagesRead}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            (totalPagesRead / 1000) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Livros Completados</span>
                      <span>{completedBooks.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            (completedBooks.length / 25) *
                              100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <ReadingCalendar />
        </TabsContent>

        <TabsContent
          value="achievements"
          className="space-y-6"
        >
          <AchievementsPanel />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showProfileManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <ProfileManager />
            <div className="p-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowProfileManager(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showUserSearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <UserSearch />
            <div className="p-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowUserSearch(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
