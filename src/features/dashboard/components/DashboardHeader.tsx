import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  onProfileClick?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userFullName,
  userAvatarUrl,
  currentLevel,
  points,
  onSignOut,
  onSettings,
  onProfileClick,
  className,
}) => {
  const getInitials = (name?: string | null): string => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(word => word.charAt(0))
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
    <header
      className={cn(
        "flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm",
        className
      )}
    >
      {/* Logo e Brand à esquerda */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">RQ</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-slate-900">ReadQuest</h1>
            <p className="text-xs text-slate-500">Sua jornada de leitura</p>
          </div>
        </div>
      </div>

      {/* User info e actions à direita */}
      <div className="flex items-center space-x-4">
        {/* User stats - hidden on mobile */}
        <div className="hidden md:flex items-center space-x-3">
          <Badge
            variant="secondary"
            className={cn(
              "text-sm font-semibold border",
              currentLevel === "Explorador"
                ? "bg-green-700 text-white border-green-800"
                : getLevelColor(currentLevel)
            )}
          >
            {currentLevel}
          </Badge>
          <span className="text-sm text-slate-700 font-medium">
            {points.toLocaleString()} pontos
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {onSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettings}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Configurações"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* User avatar */}
        <Avatar
          className="h-8 w-8 ring-2 ring-slate-200 cursor-pointer hover:ring-slate-300 transition-colors"
          onClick={onProfileClick}
        >
          <AvatarImage src={userAvatarUrl || ""} alt={userFullName || "User"} />
          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
            {getInitials(userFullName)}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};
