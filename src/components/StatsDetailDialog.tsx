import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Star,
  Trophy,
  Flame,
  TrendingUp,
  Calendar,
  Award,
} from "lucide-react";
import type { Book } from "@/types/reading";

interface StatsDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type:
    | "completed"
    | "pages"
    | "points"
    | "level"
    | "streak"
    | "bestStreak";
  books: Book[];
  profile: any;
}

export const StatsDetailDialog: React.FC<
  StatsDetailDialogProps
> = ({ open, onOpenChange, type, books, profile }) => {
  const completedBooks = books.filter(
    (book) => book.status === "completed"
  );
  const currentlyReading = books.filter(
    (book) => book.status === "reading"
  );

  const getDialogContent = () => {
    switch (type) {
      case "completed":
        return {
          title: "Livros Concluídos",
          description: `Você completou ${completedBooks.length} livros!`,
          icon: BookOpen,
          content: (
            <div className="space-y-4">
              {completedBooks.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-muted-foreground">
                    Nenhum livro concluído ainda
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedBooks.map((book) => (
                    <Card
                      key={book.id}
                      className="overflow-hidden"
                    >
                      <div className="flex">
                        {book.cover_url ? (
                          <img
                            src={book.cover_url}
                            alt={book.title}
                            className="w-16 h-20 object-cover"
                          />
                        ) : (
                          <div className="w-16 h-20 bg-gray-200 flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1 p-3">
                          <h4 className="font-semibold text-sm line-clamp-2">
                            {book.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {book.author}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="secondary"
                              className="text-xs"
                            >
                              {book.total_pages} páginas
                            </Badge>
                            {book.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs">
                                  {book.rating}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ),
        };

      case "pages":
        const totalPages = books.reduce(
          (total, book) => total + (book.pages_read || 0),
          0
        );
        return {
          title: "Páginas Lidas",
          description: `Você leu ${Intl.NumberFormat().format(
            totalPages
          )} páginas!`,
          icon: BookOpen,
          content: (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Total de Páginas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Intl.NumberFormat().format(
                        totalPages
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Média por Livro
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {books.length > 0
                        ? Math.round(
                            totalPages / books.length
                          )
                        : 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">
                  Progresso por Livro
                </h4>
                {books.slice(0, 5).map((book) => (
                  <div key={book.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="line-clamp-1">
                        {book.title}
                      </span>
                      <span>
                        {book.pages_read || 0}/
                        {book.total_pages}
                      </span>
                    </div>
                    <Progress
                      value={
                        ((book.pages_read || 0) /
                          book.total_pages) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          ),
        };

      case "points":
        const totalPoints = books.reduce(
          (total, book) => total + (book.pages_read || 0),
          0
        );
        return {
          title: "Pontos de Experiência",
          description: `Você acumulou ${Intl.NumberFormat().format(
            totalPoints
          )} pontos!`,
          icon: Star,
          content: (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Total de Pontos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Intl.NumberFormat().format(
                        totalPoints
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Nível Atual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {profile?.level || "Iniciante"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">
                  Como ganhar mais pontos:
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 1 ponto por página lida</li>
                  <li>• Bônus por completar livros</li>
                  <li>• Manter sequência de leitura</li>
                  <li>• Conquistar achievements</li>
                </ul>
              </div>
            </div>
          ),
        };

      case "level":
        return {
          title: "Nível Atual",
          description: `Você está no nível ${
            profile?.level || "Iniciante"
          }!`,
          icon: Award,
          content: (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    {profile?.level || "Iniciante"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <strong>Pontos atuais:</strong>{" "}
                      {profile?.points || 0}
                    </div>
                    <div className="text-sm">
                      <strong>Livros concluídos:</strong>{" "}
                      {completedBooks.length}
                    </div>
                    <div className="text-sm">
                      <strong>Páginas lidas:</strong>{" "}
                      {profile?.total_pages_read || 0}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <h4 className="font-semibold">
                  Níveis disponíveis:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Badge variant="outline">
                    Iniciante (0-499)
                  </Badge>
                  <Badge variant="outline">
                    Leitor (500-1999)
                  </Badge>
                  <Badge variant="outline">
                    Entusiasta (2000-4999)
                  </Badge>
                  <Badge variant="outline">
                    Mestre (5000+)
                  </Badge>
                </div>
              </div>
            </div>
          ),
        };

      case "streak":
        return {
          title: "Sequência Atual",
          description: `Você está em uma sequência de ${
            profile?.reading_streak || 0
          } dias!`,
          icon: Flame,
          content: (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    {profile?.reading_streak || 0} dias
                    consecutivos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Continue lendo todos os dias para manter
                    sua sequência!
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <h4 className="font-semibold">
                  Dicas para manter a sequência:
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • Leia pelo menos uma página por dia
                  </li>
                  <li>• Configure lembretes diários</li>
                  <li>• Tenha sempre um livro à mão</li>
                  <li>• Use momentos livres para ler</li>
                </ul>
              </div>
            </div>
          ),
        };

      case "bestStreak":
        return {
          title: "Melhor Sequência",
          description: `Sua melhor sequência foi de ${
            profile?.best_streak || 0
          } dias!`,
          icon: TrendingUp,
          content: (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    {profile?.best_streak || 0} dias
                    (recorde)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      Sequência atual:
                    </span>
                    <span className="font-semibold">
                      {profile?.reading_streak || 0} dias
                    </span>
                  </div>
                  <Progress
                    value={
                      ((profile?.reading_streak || 0) /
                        Math.max(
                          profile?.best_streak || 1,
                          1
                        )) *
                      100
                    }
                    className="h-2 mt-2"
                  />
                </CardContent>
              </Card>

              <div className="text-center">
                {(profile?.reading_streak || 0) >=
                (profile?.best_streak || 0) ? (
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <Trophy className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                      🎉 Novo recorde! Continue assim!
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Faltam{" "}
                    {(profile?.best_streak || 0) -
                      (profile?.reading_streak || 0)}{" "}
                    dias para igualar seu recorde!
                  </p>
                )}
              </div>
            </div>
          ),
        };

      default:
        return {
          title: "Estatísticas",
          description: "Detalhes das suas estatísticas",
          icon: BookOpen,
          content: <div>Conteúdo não encontrado</div>,
        };
    }
  };

  const {
    title,
    description,
    icon: Icon,
    content,
  } = getDialogContent();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">{content}</div>
      </DialogContent>
    </Dialog>
  );
};
