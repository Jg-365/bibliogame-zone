import React from "react";
import { Bell, Flame, RefreshCw, Settings, Star, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ProfileHeroProps {
  fullName?: string | null;
  username?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  userInitial?: string;
  displayLevel: string;
  displayPoints: number;
  streak: number;
  profileLoading: boolean;
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onSyncKnowledge: () => void;
  isSyncingKnowledge?: boolean;
  syncProgressText?: string | null;
}

export const ProfileHero = ({
  fullName,
  username,
  bio,
  avatarUrl,
  bannerUrl,
  userInitial,
  displayLevel,
  displayPoints,
  streak,
  profileLoading,
  onOpenNotifications,
  onOpenSettings,
  onSyncKnowledge,
  isSyncingKnowledge = false,
  syncProgressText,
}: ProfileHeroProps) => {
  return (
    <Card className="overflow-hidden border-border/70">
      <div className="relative h-24 overflow-hidden sm:h-32">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt="Banner do perfil"
            className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.02] dark:brightness-90 dark:contrast-110"
          />
        ) : (
          <div className="h-full w-full bg-card-pattern" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-background/15 to-transparent dark:from-background/70 dark:via-background/30" />
      </div>
      <CardContent className="relative pb-6 pt-0">
        <div className="-mt-12 flex flex-col items-start gap-4 sm:-mt-16 sm:flex-row sm:items-end">
          <Avatar className="h-24 w-24 border-4 border-background shadow-xl sm:h-32 sm:w-32">
            <AvatarImage src={avatarUrl || ""} />
            <AvatarFallback className="text-2xl font-bold sm:text-4xl">
              {userInitial}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl font-bold sm:text-3xl">{fullName || "Seu perfil"}</h1>
                {username ? <p className="text-muted-foreground">@{username}</p> : null}
              </div>
              <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto">
                <Button
                  onClick={onSyncKnowledge}
                  size="sm"
                  disabled={isSyncingKnowledge}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${isSyncingKnowledge ? "animate-spin" : ""}`}
                  />
                  {isSyncingKnowledge ? "Sincronizando..." : "Sincronizar livros"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenNotifications}
                  className="w-full sm:w-auto"
                >
                  <Bell className="mr-2 h-4 w-4" />
                  Notificações
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenSettings}
                  className="w-full sm:w-auto"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Editar perfil
                </Button>
              </div>
            </div>

            {bio ? <p className="text-sm text-muted-foreground">{bio}</p> : null}

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {displayLevel}
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Star className="h-3 w-3 text-accent-foreground" />
                {profileLoading ? "-" : displayPoints} pontos
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Flame className="h-3 w-3 text-orange-500" />
                {profileLoading ? "-" : streak} dias
              </Badge>
            </div>
            {syncProgressText ? (
              <p className="text-xs text-muted-foreground">{syncProgressText}</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
