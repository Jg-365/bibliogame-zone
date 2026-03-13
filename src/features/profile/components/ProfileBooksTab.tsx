import React from "react";
import { m } from "framer-motion";
import { Book, BookOpen, Star } from "lucide-react";
import type { Book as BookType } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface ProfileBooksTabProps {
  readingBooks: BookType[];
  completedBooks: BookType[];
  onSelectBook: (bookId: string) => void;
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
            <CardContent className="p-2">
              <h3 className="line-clamp-2 min-h-[2.2rem] text-xs font-semibold leading-tight">
                {book.title}
              </h3>
              <p className="line-clamp-1 text-xs text-muted-foreground">{book.author}</p>
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
}: ProfileBooksTabProps) => {
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
      {readingBooks.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Lendo agora ({readingBooks.length})</h3>
          </div>
          <BookCoverGrid books={readingBooks} onSelectBook={onSelectBook} mode="reading" />
        </div>
      ) : null}

      {completedBooks.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-success" />
            <h3 className="text-lg font-semibold">Concluídos ({completedBooks.length})</h3>
          </div>
          <BookCoverGrid books={completedBooks} onSelectBook={onSelectBook} mode="completed" />
        </div>
      ) : null}
    </div>
  );
};
