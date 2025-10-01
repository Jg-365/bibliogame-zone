import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Book,
  BookOpen,
  Target,
  Star,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { cn } from "@/shared/utils";
import type { BaseComponentProps } from "@/shared/types";

interface ReadingStatsCardsProps
  extends BaseComponentProps {
  totalBooks: number;
  completedBooks: number;
  completedThisYear: number;
  currentlyReading: number;
  wantToRead: number;
  averageRating: number;
  totalPages: number;
  currentStreak: number;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  className,
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={cn("text-xs", getTrendColor())}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

export const ReadingStatsCards: React.FC<
  ReadingStatsCardsProps
> = ({
  totalBooks,
  completedBooks,
  completedThisYear,
  currentlyReading,
  wantToRead,
  averageRating,
  totalPages,
  currentStreak,
  className,
}) => {
  const formatRating = (rating: number): string => {
    return rating > 0 ? rating.toFixed(1) : "—";
  };

  const formatPages = (pages: number): string => {
    if (pages >= 1000) {
      return `${(pages / 1000).toFixed(1)}k`;
    }
    return pages.toString();
  };

  return (
    <div
      className={cn(
        "grid gap-4 md:grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      <StatCard
        title="Livros Lidos"
        value={completedBooks}
        description={`${completedThisYear} este ano`}
        icon={<Book className="h-4 w-4" />}
        trend="up"
      />

      <StatCard
        title="Lendo Agora"
        value={currentlyReading}
        description={`${wantToRead} na lista`}
        icon={<BookOpen className="h-4 w-4" />}
        trend="neutral"
      />

      <StatCard
        title="Páginas Lidas"
        value={formatPages(totalPages)}
        description="Total acumulado"
        icon={<Target className="h-4 w-4" />}
        trend="up"
      />

      <StatCard
        title="Avaliação Média"
        value={formatRating(averageRating)}
        description="Baseado nas suas notas"
        icon={<Star className="h-4 w-4" />}
        trend="neutral"
      />

      <StatCard
        title="Sequência Atual"
        value={`${currentStreak} dias`}
        description="Lendo consecutivamente"
        icon={<TrendingUp className="h-4 w-4" />}
        trend={currentStreak > 0 ? "up" : "neutral"}
      />

      <StatCard
        title="Biblioteca Total"
        value={totalBooks}
        description="Todos os livros"
        icon={<Calendar className="h-4 w-4" />}
        trend="neutral"
      />
    </div>
  );
};
