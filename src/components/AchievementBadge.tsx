import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface AchievementBadgeProps {
  title: string;
  description: string;
  icon: LucideIcon;
  unlocked?: boolean;
  rarity?: "common" | "rare" | "epic" | "legendary";
}

export const AchievementBadge = ({ 
  title, 
  description, 
  icon: Icon, 
  unlocked = false,
  rarity = "common"
}: AchievementBadgeProps) => {
  const getRarityClasses = () => {
    if (!unlocked) return "opacity-50 grayscale";
    
    switch (rarity) {
      case "legendary":
        return "bg-gradient-gold text-accent-foreground shadow-gold animate-pulse";
      case "epic":
        return "bg-gradient-primary text-primary-foreground shadow-glow";
      case "rare":
        return "bg-gradient-success text-success-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className={`p-4 rounded-lg border transition-all duration-300 hover:scale-105 ${getRarityClasses()}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${unlocked ? "bg-white/20" : "bg-muted"}`}>
          <Icon className={`h-5 w-5 ${unlocked ? "text-white" : "text-muted-foreground"}`} />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className={`text-xs mt-1 ${unlocked ? "opacity-90" : "text-muted-foreground"}`}>
            {description}
          </p>
        </div>
        {unlocked && (
          <Badge variant="secondary" className="text-xs">
            Conquistado!
          </Badge>
        )}
      </div>
    </div>
  );
};