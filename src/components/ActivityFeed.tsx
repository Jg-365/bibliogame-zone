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
import { Skeleton } from "@/components/ui/skeleton";
import { useActivities } from "@/hooks/useEnhancedSocial";
import type { Activity } from "@/hooks/useEnhancedSocial";
import {
  BookOpen,
  Flame,
  Heart,
  MessageCircle,
  Trophy,
  Plus,
  BookmarkPlus,
  Play,
  FileText,
} from "lucide-react";

const getActivityIcon = (activityType: string) => {
  const icons = {
    book_added: BookmarkPlus,
    book_completed: BookOpen,
    book_started: Play,
    reading_session: FileText,
    post_created: Plus,
    post_liked: Heart,
    comment_added: MessageCircle,
    achievement_unlocked: Trophy,
    profile_updated: FileText,
  };

  const Icon =
    icons[activityType as keyof typeof icons] || BookOpen;
  return Icon;
};

const getActivityColor = (activityType: string) => {
  const colors = {
    book_added: "text-blue-600 bg-blue-100",
    book_completed: "text-green-600 bg-green-100",
    book_started: "text-purple-600 bg-purple-100",
    reading_session: "text-orange-600 bg-orange-100",
    post_created: "text-indigo-600 bg-indigo-100",
    post_liked: "text-red-600 bg-red-100",
    comment_added: "text-cyan-600 bg-cyan-100",
    achievement_unlocked: "text-yellow-600 bg-yellow-100",
    profile_updated: "text-gray-600 bg-gray-100",
  };

  return (
    colors[activityType as keyof typeof colors] ||
    "text-gray-600 bg-gray-100"
  );
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) return "agora";
  if (diffInMinutes < 60) return `${diffInMinutes}min`;
  if (diffInHours < 24) return `${diffInHours}h`;
  if (diffInDays < 7) return `${diffInDays}d`;

  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });
};

export const ActivityFeed = ({
  userId,
  limit = 10,
}: {
  userId?: string;
  limit?: number;
}) => {
  const [visibleLimit, setVisibleLimit] = React.useState(
    Math.min(limit, 8)
  );
  const activitiesQuery = useActivities(
    userId,
    visibleLimit
  );
  const activities: Activity[] =
    (activitiesQuery.data as Activity[]) || [];
  const isLoading = activitiesQuery.isLoading;

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Flame className="h-5 w-5 text-orange-500" />
          {userId
            ? "Suas Atividades"
            : "Atividades Recentes"}
        </CardTitle>
        <CardDescription className="text-slate-600">
          {userId
            ? "Suas atividades de leitura"
            : "Atividades recentes da comunidade"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-start space-x-3"
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="mb-2 font-medium">
              Nenhuma atividade recente
            </p>
            <p className="text-sm text-slate-400">
              {userId
                ? "Comece a ler, criar posts ou interagir para ver suas atividades aqui!"
                : "Complete livros e desbloqueie conquistas para ver atividades aqui!"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => {
              const Icon = getActivityIcon(
                activity.activity_type
              );
              const colorClass = getActivityColor(
                activity.activity_type
              );

              return (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={activity.user_avatar_url}
                      />
                      <AvatarFallback className="text-xs">
                        {(
                          activity.user_username ||
                          activity.user_full_name ||
                          "U"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`p-1.5 rounded-full ${colorClass}`}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        {activity.user_username ||
                          activity.user_full_name ||
                          "Usuário"}
                      </span>
                      <span className="text-gray-700 ml-1">
                        {activity.description}
                      </span>
                    </div>

                    {/* Metadata adicional baseado no tipo */}
                    {activity.metadata && (
                      <div className="mt-1">
                        {activity.activity_type ===
                          "book_completed" &&
                          activity.metadata.rating && (
                            <Badge
                              variant="secondary"
                              className="text-xs"
                            >
                              ⭐ {activity.metadata.rating}
                              /5
                            </Badge>
                          )}
                        {activity.activity_type ===
                          "reading_session" &&
                          activity.metadata.pages_read && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              📄{" "}
                              {activity.metadata.pages_read}{" "}
                              páginas
                            </Badge>
                          )}
                        {activity.activity_type ===
                          "achievement_unlocked" &&
                          activity.metadata
                            .achievement_icon && (
                            <Badge
                              variant="default"
                              className="text-xs bg-yellow-100 text-yellow-800"
                            >
                              {
                                activity.metadata
                                  .achievement_icon
                              }{" "}
                              Conquista!
                            </Badge>
                          )}
                      </div>
                    )}

                    <div className="mt-1 text-xs text-gray-500">
                      {formatTimeAgo(activity.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Load more button if there are likely more items to fetch */}
            {visibleLimit < limit && (
              <div className="text-center mt-3">
                <button
                  className="px-3 py-2 rounded-md bg-blue-50 border border-blue-200 text-blue-600 text-sm"
                  onClick={() => setVisibleLimit(limit)}
                >
                  Carregar mais
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
