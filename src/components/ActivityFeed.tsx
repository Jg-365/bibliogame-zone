import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Trophy,
  Target,
  MessageSquare,
  Calendar,
  Heart,
  Star,
  Flame,
} from "lucide-react";
import { useActivity } from "@/hooks/useSocial";
import type { ActivityType } from "@/types/reading";

const getActivityIcon = (
  type: ActivityType | "reading_progress"
) => {
  const icons = {
    book_completed: BookOpen,
    book_started: Calendar,
    reading_progress: BookOpen,
    achievement_unlocked: Trophy,
    challenge_completed: Target,
    review_added: MessageSquare,
  };

  const Icon =
    icons[type as keyof typeof icons] || BookOpen;
  return <Icon className="h-4 w-4" />;
};
const getActivityColor = (
  type: ActivityType | "reading_progress"
) => {
  const colors = {
    book_completed: "text-green-600 bg-green-100",
    book_started: "text-blue-600 bg-blue-100",
    reading_progress: "text-indigo-600 bg-indigo-100",
    achievement_unlocked: "text-yellow-600 bg-yellow-100",
    challenge_completed: "text-purple-600 bg-purple-100",
    review_added: "text-orange-600 bg-orange-100",
  };

  return (
    colors[type as keyof typeof colors] ||
    "text-gray-600 bg-gray-100"
  );
};
const getActivityMessage = (activity: any) => {
  const { type, data } = activity;

  switch (type) {
    case "book_completed":
      return `concluiu a leitura de "${data.book_title}" por ${data.author}`;
    case "book_started":
      return `começou a ler "${data.book_title}" por ${data.author}`;
    case "reading_progress":
      return `progrediu na leitura de "${data.book_title}" (${data.pages_read}/${data.total_pages} páginas)`;
    case "achievement_unlocked":
      return `desbloqueou a conquista "${data.achievement_title}"`;
    case "challenge_completed":
      return `completou o desafio "${data.challenge_title}"`;
    case "review_added":
      return `escreveu uma resenha de "${data.book_title}"`;
    default:
      return "teve uma atividade";
  }
};

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 1) {
    return "Agora há pouco";
  } else if (diffInHours < 24) {
    return `${diffInHours}h atrás`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return "Ontem";
    } else if (diffInDays < 7) {
      return `${diffInDays} dias atrás`;
    } else {
      return date.toLocaleDateString("pt-BR");
    }
  }
};

const getInitials = (name?: string) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export const ActivityFeed = () => {
  const { data: activities, isLoading } = useActivity();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Feed de Atividades
          </CardTitle>
          <CardDescription>
            Carregando atividades...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex gap-3 p-3 animate-pulse"
              >
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5" />
            Feed de Atividades
          </CardTitle>
          <CardDescription>
            Atividades recentes da sua rede de contatos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="mb-2">
              Nenhuma atividade recente
            </p>
            <p className="text-sm">
              Complete livros e desbloqueie conquistas para
              ver suas atividades aqui!
            </p>
            <p className="text-xs mt-2 opacity-75">
              Em breve você também poderá ver atividades de
              amigos que seguir.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5" />
          Feed de Atividades
        </CardTitle>
        <CardDescription>
          Atividades recentes da sua rede de contatos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
            >
              {/* User Avatar */}
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={
                    activity.profile?.avatarUrl || undefined
                  }
                />
                <AvatarFallback className="text-xs">
                  {getInitials(
                    activity.profile?.fullName ||
                      activity.profile?.username
                  )}
                </AvatarFallback>
              </Avatar>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  {/* Activity Icon */}
                  <div
                    className={`p-1.5 rounded-lg ${getActivityColor(
                      activity.type
                    )}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Activity Text */}
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">
                        {activity.profile?.fullName ||
                          activity.profile?.username ||
                          "Usuário"}
                      </span>{" "}
                      {getActivityMessage(activity)}
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500">
                        {getTimeAgo(activity.createdAt)}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs"
                      >
                        {activity.type ===
                          "book_completed" &&
                          "Livro Concluído"}
                        {activity.type === "book_started" &&
                          "Nova Leitura"}
                        {activity.type ===
                          "reading_progress" && "Progresso"}
                        {activity.type ===
                          "achievement_unlocked" &&
                          "Conquista"}
                        {activity.type ===
                          "challenge_completed" &&
                          "Desafio"}
                        {activity.type === "review_added" &&
                          "Resenha"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Activity Details */}
                {activity.type === "book_completed" &&
                  activity.data.rating && (
                    <div className="flex items-center gap-1 mt-2 ml-8">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < activity.data.rating
                              ? "text-yellow-500 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">
                        {activity.data.rating}/5
                      </span>
                    </div>
                  )}

                {activity.type === "review_added" &&
                  activity.data.review && (
                    <div className="mt-2 ml-8 p-2 bg-gray-50 rounded text-xs text-gray-700">
                      "{activity.data.review}"
                    </div>
                  )}
              </div>

              {/* Interaction Buttons */}
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                  <Heart className="h-4 w-4 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="mt-6 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver mais atividades
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
