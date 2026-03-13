import React, { useMemo, useState } from "react";
import { BookOpen, Filter, Search, Sparkles, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBooks } from "@/hooks/useBooks";
import { Badge } from "@/components/ui/badge";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface BookLibraryProps {
  className?: string;
}

export const BookLibrary: React.FC<BookLibraryProps> = ({ className = "" }) => {
  const { books = [], isLoading } = useBooks();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [filterBy, setFilterBy] = useState("all");

  const booksByStatus = useMemo(() => {
    if (!Array.isArray(books)) {
      return { reading: [], completed: [], wantToRead: [] };
    }

    return {
      reading: books.filter((book) => book.status === "reading" || book.status === "lendo"),
      completed: books.filter((book) => book.status === "completed" || book.status === "lido"),
      wantToRead: books.filter(
        (book) => book.status === "want-to-read" || book.status === "não lido",
      ),
    };
  }, [books]);

  const rewardMissions = useMemo(() => {
    return booksByStatus.reading
      .filter((book) => book.total_pages > 0)
      .map((book) => {
        const pagesRead = book.pages_read || 0;
        const remaining = Math.max(0, book.total_pages - pagesRead);
        const progress = Math.round((pagesRead / book.total_pages) * 100);

        return {
          id: book.id,
          title: book.title,
          remaining,
          progress,
        };
      })
      .sort((a, b) => a.remaining - b.remaining)
      .slice(0, 3);
  }, [booksByStatus.reading]);

  const filteredAndSortedBooks = useMemo(() => {
    if (!Array.isArray(books)) return [];

    let filtered = [...books];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.genres?.some((genre) => genre.toLowerCase().includes(query)),
      );
    }

    if (filterBy !== "all") {
      switch (filterBy) {
        case "reading":
          filtered = filtered.filter(
            (book) => book.status === "reading" || book.status === "lendo",
          );
          break;
        case "completed":
          filtered = filtered.filter(
            (book) => book.status === "completed" || book.status === "lido",
          );
          break;
        case "want-to-read":
          filtered = filtered.filter(
            (book) => book.status === "want-to-read" || book.status === "não lido",
          );
          break;
        case "favorites":
          filtered = filtered.filter((book) => book.is_favorite);
          break;
      }
    }

    switch (sortBy) {
      case "recent":
        return filtered.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
        );
      case "title":
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case "author":
        return filtered.sort((a, b) => a.author.localeCompare(b.author));
      case "rating":
        return filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "progress":
        return filtered.sort((a, b) => {
          const progressA = a.total_pages > 0 ? (a.pages_read || 0) / a.total_pages : 0;
          const progressB = b.total_pages > 0 ? (b.pages_read || 0) / b.total_pages : 0;
          return progressB - progressA;
        });
      default:
        return filtered;
    }
  }, [books, searchQuery, sortBy, filterBy]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-4 p-4">
              <div className="flex gap-3">
                <Skeleton className="h-28 w-20 rounded-[var(--radius-md)]" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-2/4" />
                  <Skeleton className="h-2 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{booksByStatus.reading.length} lendo</Badge>
        <Badge variant="success">{booksByStatus.completed.length} concluídos</Badge>
        <Badge variant="outline">{booksByStatus.wantToRead.length} quero ler</Badge>
      </div>

      {rewardMissions.length > 0 ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Missões de recompensa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {rewardMissions.map((mission) => (
              <button
                key={mission.id}
                onClick={() => {
                  setFilterBy("reading");
                  setSortBy("progress");
                  setSearchQuery(mission.title);
                }}
                className="flex w-full items-center justify-between rounded-[var(--radius-md)] border border-border/70 bg-card px-3 py-2 text-left transition-colors hover:bg-muted"
              >
                <div>
                  <p className="line-clamp-1 text-sm font-medium">{mission.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {mission.remaining} páginas para concluir
                  </p>
                </div>
                <Badge variant="default">{mission.progress}%</Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/70">
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterBy === "reading" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterBy("reading")}
            >
              <Target className="mr-2 h-4 w-4" />
              Foco leitura
            </Button>
            <Button
              variant={sortBy === "progress" ? "default" : "outline"}
              size="sm"
              onClick={() => setSortBy("progress")}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Mais perto de concluir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterBy("all");
                setSortBy("recent");
                setSearchQuery("");
              }}
            >
              Limpar filtros
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, autor ou gênero..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-full lg:w-44">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="reading">Lendo</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="want-to-read">Quero ler</SelectItem>
                <SelectItem value="favorites">Favoritos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-44">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recente</SelectItem>
                <SelectItem value="title">Título</SelectItem>
                <SelectItem value="author">Autor</SelectItem>
                <SelectItem value="rating">Avaliação</SelectItem>
                <SelectItem value="progress">Progresso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredAndSortedBooks.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAndSortedBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : !books || books.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Sua biblioteca está vazia</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              Adicione livros e acompanhe seu progresso.
            </p>
            <Button>
              <BookOpen className="mr-2 h-4 w-4" />
              Adicionar primeiro livro
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Search className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Nenhum resultado encontrado</h3>
            <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
