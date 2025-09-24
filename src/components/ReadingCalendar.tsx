import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Book,
  Target,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ReadingActivity {
  date: string;
  pages_read: number;
  sessions_count: number;
  books_completed: number;
}

export const ReadingCalendar = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(
    new Date()
  );

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Get reading activities for the current month
  const { data: activities = [], isLoading } = useQuery({
    queryKey: [
      "reading-calendar",
      currentYear,
      currentMonth,
      user?.id,
    ],
    queryFn: async () => {
      if (!user?.id) return [];

      const startOfMonth = new Date(
        currentYear,
        currentMonth,
        1
      );
      const endOfMonth = new Date(
        currentYear,
        currentMonth + 1,
        0
      );

      const { data, error } = await supabase
        .from("reading_sessions")
        .select(
          `
          session_date,
          pages_read,
          book_id,
          books (
            status,
            date_completed
          )
        `
        )
        .eq("user_id", user.id)
        .gte("session_date", startOfMonth.toISOString())
        .lte("session_date", endOfMonth.toISOString())
        .order("session_date", { ascending: true });

      if (error) throw error;

      // Group by date
      const groupedData: {
        [key: string]: ReadingActivity;
      } = {};

      data?.forEach((session: any) => {
        const date = session.session_date.split("T")[0];

        if (!groupedData[date]) {
          groupedData[date] = {
            date,
            pages_read: 0,
            sessions_count: 0,
            books_completed: 0,
          };
        }

        groupedData[date].pages_read += session.pages_read;
        groupedData[date].sessions_count += 1;

        // Check if a book was completed on this date
        if (
          session.books?.status === "completed" &&
          session.books?.date_completed?.split("T")[0] ===
            date
        ) {
          groupedData[date].books_completed += 1;
        }
      });

      return Object.values(groupedData);
    },
    enabled: !!user?.id,
  });

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(currentMonth - 1);
    } else {
      newDate.setMonth(currentMonth + 1);
    }
    setCurrentDate(newDate);
  };

  const getDaysInMonth = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(
      currentYear,
      currentMonth + 1,
      0
    );
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getActivityForDate = (
    day: number
  ): ReadingActivity | null => {
    const dateStr = `${currentYear}-${(currentMonth + 1)
      .toString()
      .padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;
    return (
      activities.find(
        (activity) => activity.date === dateStr
      ) || null
    );
  };

  const getActivityLevel = (
    activity: ReadingActivity | null
  ): string => {
    if (!activity || activity.pages_read === 0)
      return "bg-gray-100";
    if (activity.pages_read <= 10) return "bg-green-200";
    if (activity.pages_read <= 25) return "bg-green-300";
    if (activity.pages_read <= 50) return "bg-green-400";
    return "bg-green-500";
  };

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const weekDays = [
    "Dom",
    "Seg",
    "Ter",
    "Qua",
    "Qui",
    "Sex",
    "Sáb",
  ];

  const totalPagesThisMonth = activities.reduce(
    (sum, activity) => sum + activity.pages_read,
    0
  );
  const totalSessionsThisMonth = activities.reduce(
    (sum, activity) => sum + activity.sessions_count,
    0
  );
  const totalBooksCompletedThisMonth = activities.reduce(
    (sum, activity) => sum + activity.books_completed,
    0
  );
  const activeDaysThisMonth = activities.filter(
    (activity) => activity.pages_read > 0
  ).length;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendário de Leitura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 bg-gray-200 rounded"
                ></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendário de Leitura
            </CardTitle>
            <CardDescription>
              Acompanhe sua consistência de leitura ao longo
              do mês
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold min-w-[140px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-secondary rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {totalPagesThisMonth}
            </div>
            <div className="text-sm text-muted-foreground">
              Páginas Lidas
            </div>
          </div>
          <div className="text-center p-3 bg-secondary rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {activeDaysThisMonth}
            </div>
            <div className="text-sm text-muted-foreground">
              Dias Ativos
            </div>
          </div>
          <div className="text-center p-3 bg-secondary rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {totalSessionsThisMonth}
            </div>
            <div className="text-sm text-muted-foreground">
              Sessões
            </div>
          </div>
          <div className="text-center p-3 bg-secondary rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {totalBooksCompletedThisMonth}
            </div>
            <div className="text-sm text-muted-foreground">
              Livros Concluídos
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="space-y-2">
          {/* Week days header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth().map((day, index) => {
              if (day === null) {
                return (
                  <div key={index} className="h-10"></div>
                );
              }

              const activity = getActivityForDate(day);
              const activityLevel =
                getActivityLevel(activity);
              const isToday =
                new Date().toDateString() ===
                new Date(
                  currentYear,
                  currentMonth,
                  day
                ).toDateString();

              return (
                <div
                  key={day}
                  className={`
                    relative h-10 rounded border-2 flex items-center justify-center cursor-pointer
                    transition-all hover:scale-105
                    ${activityLevel}
                    ${
                      isToday
                        ? "border-primary border-2"
                        : "border-transparent"
                    }
                  `}
                  title={
                    activity
                      ? `${day}: ${
                          activity.pages_read
                        } páginas, ${
                          activity.sessions_count
                        } sessão(ões)${
                          activity.books_completed > 0
                            ? `, ${activity.books_completed} livro(s) concluído(s)`
                            : ""
                        }`
                      : `${day}: Nenhuma atividade`
                  }
                >
                  <span className="text-sm font-medium">
                    {day}
                  </span>
                  {activity &&
                    activity.books_completed > 0 && (
                      <div className="absolute -top-1 -right-1">
                        <Badge
                          variant="default"
                          className="h-4 w-4 p-0 rounded-full flex items-center justify-center text-xs"
                        >
                          {activity.books_completed}
                        </Badge>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-sm">
          <span>Menos</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded bg-gray-100"></div>
            <div className="w-3 h-3 rounded bg-green-200"></div>
            <div className="w-3 h-3 rounded bg-green-300"></div>
            <div className="w-3 h-3 rounded bg-green-400"></div>
            <div className="w-3 h-3 rounded bg-green-500"></div>
          </div>
          <span>Mais</span>
        </div>
      </CardContent>
    </Card>
  );
};
