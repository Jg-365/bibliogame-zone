import React, { useMemo } from "react";
import { Lightbulb, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Book } from "@/shared/types";

interface SmartRecommendationsCardProps {
  books: Book[];
}

export const SmartRecommendationsCard = ({ books }: SmartRecommendationsCardProps) => {
  const insights = useMemo(() => {
    const completed = books.filter((book) => book.status === "completed");
    const reading = books.filter((book) => book.status === "reading");
    const avgPages =
      completed.length > 0
        ? Math.round(
            completed.reduce((sum, book) => sum + (book.total_pages || 0), 0) /
              Math.max(1, completed.length),
          )
        : 0;
    const avgRating =
      completed.length > 0
        ? completed.reduce((sum, book) => sum + (book.rating || 0), 0) /
          Math.max(1, completed.length)
        : 0;

    const messages: string[] = [];
    if (avgPages > 0 && avgPages <= 260) {
      messages.push(
        "Você tende a concluir livros curtos. Sugestão: manter obras de 180-280 páginas na fila.",
      );
    } else if (avgPages > 260) {
      messages.push(
        "Você sustenta leituras longas. Sugestão: incluir 1 livro curto entre os longos para variar ritmo.",
      );
    }

    if (avgRating >= 4) {
      messages.push(
        "Seu nível de satisfação está alto. Explore autores similares aos seus 3 livros melhor avaliados.",
      );
    } else if (completed.length >= 3) {
      messages.push("Avaliações medianas recentes. Tente alternar gênero para renovar motivação.");
    }

    if (reading.length >= 3) {
      messages.push("Muitos livros em paralelo. Foque em finalizar 1 deles para ganhar tração.");
    }

    return messages.slice(0, 3);
  }, [books]);

  if (insights.length === 0) return null;

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-primary" />
          Recomendações inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {insights.map((message, index) => (
          <div key={index} className="rounded-md border border-border/70 bg-card px-3 py-2 text-sm">
            <div className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              Insight {index + 1}
              <Badge variant="secondary" className="ml-1 text-[10px]">
                auto
              </Badge>
            </div>
            <p>{message}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
