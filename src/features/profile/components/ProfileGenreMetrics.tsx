import React from "react";
import { BarChart3, BookOpen, Library, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GenreMetricItem {
  genre: string;
  books: number;
  pages: number;
  averageRating: number;
  completionRate: number;
}

interface ProfileGenreMetricsProps {
  items: GenreMetricItem[];
  activeGenre?: string | null;
  onSelectGenre?: (genre: string) => void;
}

export const ProfileGenreMetrics = ({
  items,
  activeGenre,
  onSelectGenre,
}: ProfileGenreMetricsProps) => {
  if (!items.length) return null;

  const topPages = Math.max(...items.map((item) => item.pages), 1);

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Library className="h-4 w-4 text-primary" />
          Sua assinatura por gênero
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2">
        {items.slice(0, 6).map((item) => {
          const isActive = activeGenre?.toLowerCase() === item.genre.toLowerCase();

          return (
            <button
              key={item.genre}
              type="button"
              onClick={() => onSelectGenre?.(item.genre)}
              className={`rounded-xl border bg-card/80 p-4 text-left transition hover:border-primary/40 hover:bg-muted/20 ${
                isActive ? "border-primary/50 shadow-sm shadow-primary/20" : "border-border/70"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{item.genre}</h3>
                  <p className="text-xs text-muted-foreground">
                    {item.books} livro(s) • {item.pages.toLocaleString("pt-BR")} páginas
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground/80">
                    Toque para ver os livros que formam essa assinatura.
                  </p>
                </div>
                <Badge variant="secondary">
                  {Math.round(item.completionRate * 100)}% concluídos
                </Badge>
              </div>

              <div className="mt-3 h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{ width: `${Math.max(12, (item.pages / topPages) * 100)}%` }}
                />
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div className="rounded-lg border border-border/60 bg-background/70 p-2">
                  <div className="mb-1 inline-flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    Volumes
                  </div>
                  <div className="font-semibold text-foreground">{item.books}</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/70 p-2">
                  <div className="mb-1 inline-flex items-center gap-1">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Páginas
                  </div>
                  <div className="font-semibold text-foreground">
                    {item.pages >= 1000 ? `${(item.pages / 1000).toFixed(1)}k` : item.pages}
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/70 p-2">
                  <div className="mb-1 inline-flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" />
                    Média
                  </div>
                  <div className="font-semibold text-foreground">
                    {item.averageRating > 0 ? item.averageRating.toFixed(1) : "-"}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
};
