import { motion } from "framer-motion";
import { Flame, TrendingUp } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const StreakBadge = ({ className, size = "md" }: StreakBadgeProps) => {
  const { profile } = useProfile();

  const currentStreak = (profile as any)?.current_streak || 0;
  const bestStreak = (profile as any)?.longest_streak || 0;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-2",
    lg: "text-base px-4 py-3",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  if (currentStreak === 0) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground",
          sizeClasses[size],
          className
        )}
      >
        <Flame className={cn(iconSizes[size], "opacity-50")} />
        <span>0 dias</span>
      </div>
    );
  }

  const getStreakTheme = () => {
    if (currentStreak < 3) return "bg-orange-100 text-orange-700 border-orange-200";
    if (currentStreak < 7) return "bg-red-100 text-red-700 border-red-200";
    if (currentStreak < 30) return "bg-purple-100 text-purple-700 border-purple-200";
    return "bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-300";
  };

  const isRecord = currentStreak === bestStreak && currentStreak > 0;

  return (
    <motion.div
      animate={
        currentStreak > 0
          ? {
              scale: [1, 1.05, 1],
            }
          : {}
      }
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border",
        getStreakTheme(),
        sizeClasses[size],
        className
      )}
    >
      <motion.div
        animate={
          currentStreak > 0
            ? {
                rotate: [0, 10, -10, 0],
              }
            : {}
        }
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Flame className={iconSizes[size]} />
      </motion.div>
      <span className="font-medium">{currentStreak} dias</span>
      {isRecord && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <TrendingUp className={cn(iconSizes[size], "text-yellow-600")} />
        </motion.div>
      )}
    </motion.div>
  );
};
