import React from "react";
import {
  BookOpen,
  FileText,
  Flame,
  Heart,
  MessageCircle,
  Plus,
  Trophy,
  BookmarkPlus,
  Play,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivities, type Activity } from "@/hooks/useEnhancedSocial";
import { toSecureAssetUrl } from "@/lib/media";

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

  return icons[activityType as keyof typeof icons] || BookOpen;
};

const getActivityTone = (activityType: string) => {
  const tones = {
    book_added: "text-primary bg-primary/10",
    book_completed: "text-success bg-success/10",
    book_started: "text-accent-foreground bg-accent/20",
    reading_session: "text-orange-500 bg-orange-500/10",
    post_created: "text-primary bg-primary/10",
    post_liked: "text-destructive bg-destructive/10",
    comment_added: "text-cyan-600 bg-cyan-500/10",
    achievement_unlocked: "text-accent-foreground bg-accent/20",
    profile_updated: "text-muted-foreground bg-muted",
  };

  return tones[activityType as keyof typeof tones] || "text-muted-foreground bg-muted";
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

export const ActivityFeed = ({ userId, limit = 10 }: { userId?: string; limit?: number }) => {
  const [visibleLimit, setVisibleLimit] = React.useState(Math.min(limit, 8));
  const activitiesQuery = useActivities(userId, visibleLimit);
  const activities: Activity[] = (activitiesQuery.data as Activity[]) || [];
  const isLoading = activitiesQuery.isLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          {userId ? "Suas atividades" : "Atividades recentes"}
        </CardTitle>
        <CardDescription>
          {userId
            ? "Acompanhe sua consistência e evolução."
            : "Veja o que a comunidade está lendo e compartilhando."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <BookOpen className="mx-auto mb-3 h-10 w-10" />
            <p className="mb-1 font-medium">Nenhuma atividade recente</p>
            <p className="text-sm">
              {userId
                ? "Comece a ler, criar posts ou interagir para preencher seu histórico."
                : "Complete livros e desbloqueie conquistas para aparecer aqui."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = getActivityIcon(activity.activity_type);
              const toneClass = getActivityTone(activity.activity_type);

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border/60 bg-card/50 p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={toSecureAssetUrl(activity.user_avatar_url)} />
                      <AvatarFallback className="text-xs">
                        {(activity.user_username || activity.user_full_name || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`rounded-full p-1.5 ${toneClass}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-sm">
                      <span className="font-medium">
                        {activity.user_username || activity.user_full_name || "Usuário"}
                      </span>
                      <span className="ml-1 text-muted-foreground">{activity.description}</span>
                    </div>

                    {activity.metadata ? (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {activity.activity_type === "book_completed" && activity.metadata.rating ? (
                          <Badge variant="accent">⭐ {activity.metadata.rating}/5</Badge>
                        ) : null}
                        {activity.activity_type === "reading_session" &&
                        activity.metadata.pages_read ? (
                          <Badge variant="outline">{activity.metadata.pages_read} páginas</Badge>
                        ) : null}
                        {activity.activity_type === "achievement_unlocked" &&
                        activity.metadata.achievement_icon ? (
                          <Badge variant="success">
                            {activity.metadata.achievement_icon} Conquista
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}

                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatTimeAgo(activity.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}

            {visibleLimit < limit ? (
              <div className="pt-1 text-center">
                <Button variant="outline" size="sm" onClick={() => setVisibleLimit(limit)}>
                  Carregar mais
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
