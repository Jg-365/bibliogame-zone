import React from "react";
import { cn } from "@/lib/utils";
import { useResponsive } from "@/shared/utils/responsive";
import { Home, BookOpen, Users, Trophy, User, MessageCircle, Search } from "lucide-react";

interface MobileNavbarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAddBook?: () => void;
}

export const MobileNavbar: React.FC<MobileNavbarProps> = ({
  activeTab,
  onTabChange,
  onAddBook,
}) => {
  const { isMobile } = useResponsive();

  if (!isMobile) return null;

  const navItems = [
    {
      id: "overview",
      label: "Início",
      icon: Home,
    },
    {
      id: "books",
      label: "Biblioteca",
      icon: BookOpen,
    },
    {
      id: "social",
      label: "Posts",
      icon: MessageCircle,
      isHighlighted: true,
    },
    {
      id: "achievements",
      label: "Conquistas",
      icon: Trophy,
    },
    {
      id: "profile",
      label: "Perfil",
      icon: User,
    },
  ];

  const handleItemClick = (item: (typeof navItems)[0]) => {
    onTabChange(item.id);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white backdrop-blur-md border-t-2 border-slate-300 shadow-lg sm:hidden">
      <div className="flex items-center justify-around px-4 py-3 max-w-md mx-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isHighlighted = item.isHighlighted;

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                "flex flex-col items-center justify-center min-h-[64px] px-3 py-2 rounded-lg transition-all duration-200 border",
                isHighlighted
                  ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700 scale-110 border-blue-700"
                  : isActive
                  ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent font-medium"
              )}
              aria-label={item.label}
            >
              <Icon
                className={cn(
                  "transition-all duration-200",
                  isHighlighted ? "h-6 w-6" : "h-5 w-5",
                  isActive && !isHighlighted && "scale-110"
                )}
              />
              <span
                className={cn(
                  "text-xs mt-1 font-medium transition-all duration-200",
                  isHighlighted && "text-[10px]"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
