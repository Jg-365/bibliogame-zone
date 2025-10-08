import React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/shared/utils/responsive";
import { Home, BookOpen, Users, Trophy, User, MessageCircle, Search, Library } from "lucide-react";

interface MobileNavbarProps {
  activeTab?: string;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({ activeTab }) => {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  if (!isMobile) return null;

  const navItems = [
    {
      id: "social",
      label: "Início",
      icon: Home,
      path: "/social-feed",
    },
    {
      id: "search",
      label: "Buscar",
      icon: Search,
      path: "/search",
    },
    {
      id: "library",
      label: "Biblioteca",
      icon: Library,
      path: "/library",
    },
    {
      id: "profile",
      label: "Perfil",
      icon: User,
      path: "/profile",
    },
  ];

  const handleItemClick = (item: (typeof navItems)[0]) => {
    navigate(item.path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-lg sm:hidden">
      <div className="flex items-center justify-around px-1 py-2 max-w-md mx-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || window.location.pathname === item.path;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 flex-1 max-w-[80px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              aria-label={item.label}
            >
              <Icon
                className={cn("transition-all duration-200", isActive ? "h-5 w-5" : "h-5 w-5")}
              />
              <span
                className={cn(
                  "text-[10px] font-medium transition-all duration-200",
                  isActive && "font-semibold"
                )}
              >
                {item.label}
              </span>
              {isActive && <div className="absolute bottom-0 w-10 h-0.5 bg-primary rounded-full" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
