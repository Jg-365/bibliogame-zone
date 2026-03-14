import React, { useMemo, useState } from "react";
import { m } from "framer-motion";
import { Book, BookOpen, Search, Star } from "lucide-react";
import type { Book as BookType } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ProfileBooksTabProps {
  readingBooks: BookType[];
  completedBooks: BookType[];
  onSelectBook: (bookId: string) => void;
  selectedGenre?: string | null;
}

const getBestCoverUrl = (coverUrl?: string) => {
  if (!coverUrl) return "";
  return coverUrl
    .replace("http://", "https://")
    .replace(/zoom=\d+/i, "zoom=3")
    .replace(/&edge=curl/gi, "")
    .replace(/&fife=w\d+/gi, "&fife=w800");
};

const BookCoverGrid = ({
  books,
  onSelectBook,
  mode,
}: {
  books: BookType[];
  mode: "reading" | "completed";
  onSelectBook: (bookId: string) => void;
}) => {
  if (!books.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Nenhum livro corresponde aos filtros atuais.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 xs:grid-cols-3 sm:grid-cols-4 sm:gap-4 md:grid-cols-5 lg:grid-cols-6">
      {books.map((book) => (
        <m.button
          key={book.id}
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="cursor-pointer text-left"
          onClick={() => onSelectBook(book.id)}
        >
          <Card className="overflow-hidden border-border/70 transition-all hover:shadow-md">
            <div className="relative aspect-[2/3] bg-muted">
              {book.cover_url ? (
                <img
                  src={getBestCoverUrl(book.cover_url)}
                  alt={book.title}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover [image-rendering:auto]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  {mode === "reading" ? (
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <Book className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
              )}

              {mode === "reading" ? (
                <Badge className="absolute right-2 top-2 border-none bg-primary px-2.5 text-primary-foreground shadow-sm">
                  <BookOpen className="mr-1 h-3 w-3" />
                  Em leitura
                </Badge>
              ) : null}

              {mode === "completed" && book.rating ? (
                <Badge className="absolute right-2 top-2 border-none bg-accent px-2.5 text-accent-foreground shadow-sm">
                  <Star className="mr-1 h-3 w-3" />
                  {book.rating}
                </Badge>
              ) : null}

              {mode === "reading" && book.total_pages > 0 ? (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-xs text-white">
                  {Math.round(((book.pages_read || 0) / book.total_pages) * 100)}%
                </div>
              ) : null}
            </div>
            <CardContent className="space-y-1 p-2">
              <h3 className="line-clamp-2 min-h-[2.2rem] text-xs font-semibold leading-tight">
                {book.title}
              </h3>
              <p className="line-clamp-1 text-xs text-muted-foreground">{book.author}</p>
              {book.genres?.[0] ? (
                <p className="line-clamp-1 text-[11px] text-muted-foreground/80">
                  {book.genres[0]}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </m.button>
      ))}
    </div>
  );
};

export const ProfileBooksTab = ({
  readingBooks,
  completedBooks,
  onSelectBook,
  selectedGenre,
}: ProfileBooksTabProps) => {
  const [query, setQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState(selectedGenre || "all");

  React.useEffect(() => {
    setGenreFilter(selectedGenre || "all");
  }, [selectedGenre]);

  const availableGenres = useMemo(() => {
    const counts = new Map<string, number>();
    [...readingBooks, ...completedBooks].forEach((book) => {
      (book.genres ?? []).forEach((genre) => {
        counts.set(genre, (counts.get(genre) ?? 0) + 1);
      });
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 8)
      .map(([genre]) => genre);
  }, [completedBooks, readingBooks]);

  const applyFilters = (books: BookType[]) =>
    books.filter((book) => {
      const matchesGenre =
        genreFilter === "all" ||
        (book.genres ?? []).some((genre) => genre.toLowerCase() === genreFilter.toLowerCase());
      const haystack =
        `${book.title} ${book.author} ${(book.genres ?? []).join(" ")}`.toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.trim().toLowerCase());
      return matchesGenre && matchesQuery;
    });

  const filteredReadingBooks = useMemo(
    () => applyFilters(readingBooks),
    [readingBooks, query, genreFilter],
  );
  const filteredCompletedBooks = useMemo(
    () => applyFilters(completedBooks),
    [completedBooks, query, genreFilter],
  );

  if (readingBooks.length === 0 && completedBooks.length === 0) {
    return (
      <Card className="border-dashed p-12 text-center">
        <Book className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">Nenhum livro</h3>
        <p className="text-sm text-muted-foreground">Comece a ler e seus livros aparecerão aqui.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Filtrar por título, autor ou gênero..."
              />
            </div>
            {genreFilter !== "all" ? (
              <Button variant="outline" size="sm" onClick={() => setGenreFilter("all")}>
                Limpar filtro
              </Button>
            ) : null}
          </div>

          {availableGenres.length ? (
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={genreFilter === "all" ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setGenreFilter("all")}
              >
                Todos
              </Badge>
              {availableGenres.map((genre) => (
                <Badge
                  key={genre}
                  variant={genreFilter === genre ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setGenreFilter(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {readingBooks.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Lendo agora ({filteredReadingBooks.length})</h3>
          </div>
          <BookCoverGrid books={filteredReadingBooks} onSelectBook={onSelectBook} mode="reading" />
        </div>
      ) : null}

      {completedBooks.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-success" />
            <h3 className="text-lg font-semibold">Concluídos ({filteredCompletedBooks.length})</h3>
          </div>
          <BookCoverGrid
            books={filteredCompletedBooks}
            onSelectBook={onSelectBook}
            mode="completed"
          />
        </div>
      ) : null}
    </div>
  );
};
