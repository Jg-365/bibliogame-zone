import React, { useMemo } from "react";
import { BookOpen, PlayCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Book } from "@/shared/types";

interface ResumeReadingCardProps {
  books: Book[];
}

export const ResumeReadingCard = ({ books }: ResumeReadingCardProps) => {
  const current = useMemo(
    () =>
      books.find(
        (book) => (book.status === "reading" || book.status === "lendo") && book.total_pages > 0,
      ),
    [books],
  );

  if (!current) return null;

  const pagesRead = current.pages_read || 0;
  const progress = Math.min(100, Math.round((pagesRead / current.total_pages) * 100));

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PlayCircle className="h-4 w-4 text-primary" />
          Retomar leitura
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div>
          <p className="line-clamp-1 text-sm font-semibold">{current.title}</p>
          <p className="text-xs text-muted-foreground">{current.author}</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {pagesRead}/{current.total_pages} páginas
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <Button size="sm" className="w-full">
          <BookOpen className="mr-2 h-4 w-4" />
          Continuar agora
        </Button>
      </CardContent>
    </Card>
  );
};
