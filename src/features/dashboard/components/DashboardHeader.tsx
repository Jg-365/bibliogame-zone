import React from "react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, Settings } from "lucide-react";
import { cn } from "@/shared/utils";
import type { BaseComponentProps } from "@/shared/types";
import type { LevelName } from "../utils/levelUtils";

interface DashboardHeaderProps extends BaseComponentProps {
  userFullName?: string | null;
  userAvatarUrl?: string | null;
  currentLevel: LevelName;
  points: number;
  onSignOut: () => void;
  onSettings?: () => void;
}

export const DashboardHeader: React.FC<
  DashboardHeaderProps
> = ({
  userFullName,
  userAvatarUrl,
  currentLevel,
  points,
  onSignOut,
  onSettings,
  className,
}) => {
  const getInitials = (name?: string | null): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const getLevelColor = (level: LevelName): string => {
    const colors = {
      Iniciante: "bg-gray-100 text-gray-800",
      Explorador: "bg-green-100 text-green-800",
      Aventureiro: "bg-blue-100 text-blue-800",
      Mestre: "bg-purple-100 text-purple-800",
      Lenda: "bg-yellow-100 text-yellow-800",
      "Grande Mestre": "bg-orange-100 text-orange-800",
      Imortal: "bg-red-100 text-red-800",
    };
    return colors[level];
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between p-6 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border",
        className
      )}
    >
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16 ring-2 ring-primary/20">
          <AvatarImage
            src={userAvatarUrl || ""}
            alt={userFullName || "User"}
          />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
            {getInitials(userFullName)}
          </AvatarFallback>
        </Avatar>

        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {userFullName || "Leitor"}!
          </h1>
          <div className="flex items-center space-x-3 mt-1">
            <Badge
              variant="secondary"
              className={cn(
                "text-sm font-medium",
                getLevelColor(currentLevel)
              )}
            >
              {currentLevel}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {points.toLocaleString()} pontos
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {onSettings && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettings}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Configurações"
          >
            <Settings className="h-5 w-5" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onSignOut}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Sair"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
