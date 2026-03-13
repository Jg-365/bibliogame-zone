import React from "react";
import { BarChart3, Book, BookOpen, Clock, Star, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfileStatsGridProps {
  completedBooks: number;
  completedThisYear: number;
  readingBooks: number;
  wantToReadBooks: number;
  totalPages: number;
  averageRating: number;
  readingPace: number;
  averageDaysToComplete: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

const StatCard = ({ title, value, description, icon, trend = "neutral" }: StatCardProps) => {
  const trendColor =
    trend === "up"
      ? "text-success"
      : trend === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <Card className="border-border/70 transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={cn("text-xs", trendColor)}>{description}</p>
      </CardContent>
    </Card>
  );
};

export const ProfileStatsGrid = ({
  completedBooks,
  completedThisYear,
  readingBooks,
  wantToReadBooks,
  totalPages,
  averageRating,
  readingPace,
  averageDaysToComplete,
}: ProfileStatsGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard
        title="Livros lidos"
        value={completedBooks}
        description={`${completedThisYear} este ano`}
        icon={<Book className="h-4 w-4" />}
        trend="up"
      />
      <StatCard
        title="Lendo agora"
        value={readingBooks}
        description={`${wantToReadBooks} na lista`}
        icon={<BookOpen className="h-4 w-4" />}
      />
      <StatCard
        title="Páginas lidas"
        value={totalPages >= 1000 ? `${(totalPages / 1000).toFixed(1)}k` : totalPages}
        description="Total acumulado"
        icon={<Target className="h-4 w-4" />}
        trend="up"
      />
      <StatCard
        title="Avaliação média"
        value={averageRating > 0 ? averageRating.toFixed(1) : "-"}
        description="Suas avaliações"
        icon={<Star className="h-4 w-4" />}
      />
      <StatCard
        title="Ritmo de leitura"
        value={readingPace > 0 ? readingPace : "-"}
        description="páginas/dia"
        icon={<BarChart3 className="h-4 w-4" />}
      />
      <StatCard
        title="Tempo médio"
        value={averageDaysToComplete > 0 ? Math.round(averageDaysToComplete) : "-"}
        description="dias/livro"
        icon={<Clock className="h-4 w-4" />}
      />
    </div>
  );
};
