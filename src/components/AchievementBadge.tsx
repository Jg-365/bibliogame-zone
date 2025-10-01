import { LucideIcon } from "lucide-react";
import { AchievementBadge as BaseAchievementBadge } from "@/shared/components/ConsolidatedComponents";

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
  rarity = "common",
}: AchievementBadgeProps) => {
  return (
    <BaseAchievementBadge
      achievement={{
        id: `${title}-${description}`,
        title,
        description,
        icon: <Icon className="w-full h-full" />,
        points: 100, // Default points
        unlockedAt: unlocked ? new Date() : undefined,
        rarity,
      }}
      size="md"
    />
  );
};
