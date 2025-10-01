import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useResponsive } from "../utils/responsive";
import { BaseCard, UniversalLoader } from "./UniversalComponents";

/**
 * Consolidated Components - Specific implementations using base components
 * Replaces all duplicated components throughout the app
 */

// =============================================================================
// STATS COMPONENTS
// =============================================================================

interface StatsData {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
}

interface StatsCardProps {
  data: StatsData;
  className?: string;
  variant?: "default" | "gradient" | "outline";
}

export const StatsCard: React.FC<StatsCardProps> = ({
  data,
  className = "",
  variant = "default",
}) => {
  const { isMobile } = useResponsive();

  const content = (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <p className={cn("font-medium text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>
          {data.title}
        </p>
        <p className={cn("font-bold text-foreground", isMobile ? "text-xl" : "text-3xl")}>
          {data.value}
        </p>
        {data.subtitle && <p className="text-xs text-muted-foreground">{data.subtitle}</p>}
        {data.trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs",
              data.trend.isPositive ? "text-green-600" : "text-red-600"
            )}
          >
            <span>{data.trend.isPositive ? "↗" : "↘"}</span>
            <span>{Math.abs(data.trend.value)}%</span>
          </div>
        )}
      </div>
      {data.icon && (
        <div className={cn("text-muted-foreground", isMobile ? "text-xl" : "text-2xl")}>
          {data.icon}
        </div>
      )}
    </div>
  );

  return (
    <BaseCard
      variant="stats"
      className={cn(
        variant === "gradient" &&
          "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20",
        variant === "outline" && "border-2 border-dashed",
        className
      )}
    >
      {content}
    </BaseCard>
  );
};

// =============================================================================
// BOOK COMPONENTS
// =============================================================================

interface BookData {
  id: string;
  title: string;
  author: string;
  cover?: string;
  progress?: number;
  rating?: number;
  status?: "reading" | "completed" | "wishlist";
  genre?: string;
  pages?: number;
  currentPage?: number;
}

interface BookCardProps {
  book: BookData;
  onClick?: (book: BookData) => void;
  showProgress?: boolean;
  variant?: "grid" | "list" | "compact";
  className?: string;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onClick,
  showProgress = true,
  variant = "grid",
  className = "",
}) => {
  const { isMobile } = useResponsive();

  const handleClick = () => onClick?.(book);

  if (variant === "list") {
    return (
      <BaseCard
        variant="book"
        clickable={!!onClick}
        onClick={handleClick}
        className={cn("p-4", className)}
      >
        <div className="flex gap-4">
          {book.cover && (
            <img
              src={book.cover}
              alt={book.title}
              className={cn(
                "rounded object-cover flex-shrink-0",
                isMobile ? "w-16 h-20" : "w-20 h-28"
              )}
            />
          )}
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3 className={cn("font-semibold line-clamp-2", isMobile ? "text-sm" : "text-base")}>
                {book.title}
              </h3>
              <p className="text-sm text-muted-foreground">{book.author}</p>
            </div>

            {book.genre && (
              <span className="inline-block text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                {book.genre}
              </span>
            )}

            {showProgress && book.progress !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progresso</span>
                  <span>{book.progress}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${book.progress}%` }}
                  />
                </div>
              </div>
            )}

            {book.rating && (
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "text-sm",
                      i < book.rating! ? "text-yellow-500" : "text-gray-300"
                    )}
                  >
                    ★
                  </span>
                ))}
                <span className="text-xs text-muted-foreground ml-1">({book.rating}/5)</span>
              </div>
            )}
          </div>
        </div>
      </BaseCard>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer transition-colors",
          className
        )}
        onClick={handleClick}
      >
        {book.cover && (
          <img
            src={book.cover}
            alt={book.title}
            className="w-8 h-10 rounded object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm line-clamp-1">{book.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
        </div>
        {book.progress !== undefined && (
          <div className="text-xs text-muted-foreground">{book.progress}%</div>
        )}
      </div>
    );
  }

  // Grid variant (default)
  return (
    <BaseCard
      variant="book"
      data={book}
      clickable={!!onClick}
      onClick={handleClick}
      className={cn("h-full", className)}
    />
  );
};

// =============================================================================
// ACHIEVEMENT COMPONENTS
// =============================================================================

interface AchievementData {
  id: string;
  title: string;
  description: string;
  icon: string | React.ReactNode;
  points: number;
  unlockedAt?: Date;
  progress?: {
    current: number;
    target: number;
  };
  rarity?: "common" | "rare" | "epic" | "legendary";
}

interface AchievementBadgeProps {
  achievement: AchievementData;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
  className?: string;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  size = "md",
  showProgress = false,
  className = "",
}) => {
  const { isMobile } = useResponsive();

  const sizes = {
    sm: {
      container: "p-3",
      icon: "text-xl",
      title: "text-xs",
      description: "text-xs",
      points: "text-xs",
    },
    md: {
      container: "p-4",
      icon: "text-2xl",
      title: isMobile ? "text-sm" : "text-base",
      description: "text-xs",
      points: "text-sm",
    },
    lg: {
      container: "p-6",
      icon: "text-3xl",
      title: isMobile ? "text-base" : "text-lg",
      description: "text-sm",
      points: "text-base",
    },
  };

  const rarityColors = {
    common: "from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700",
    rare: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
    epic: "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
    legendary: "from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-800/20",
  };

  const isUnlocked = !!achievement.unlockedAt;
  const currentSize = sizes[size];

  return (
    <div
      className={cn(
        "rounded-lg border bg-gradient-to-br text-center transition-all",
        achievement.rarity ? rarityColors[achievement.rarity] : rarityColors.common,
        isUnlocked ? "shadow-sm hover:shadow-md" : "opacity-60 grayscale",
        currentSize.container,
        className
      )}
    >
      <div className="space-y-2">
        {/* Icon */}
        <div className={cn("mx-auto", currentSize.icon)}>{achievement.icon}</div>

        {/* Title */}
        <h3 className={cn("font-semibold", currentSize.title)}>{achievement.title}</h3>

        {/* Description */}
        <p className={cn("text-muted-foreground", currentSize.description)}>
          {achievement.description}
        </p>

        {/* Progress */}
        {showProgress && achievement.progress && !isUnlocked && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span>Progresso</span>
              <span>
                {achievement.progress.current}/{achievement.progress.target}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(achievement.progress.current / achievement.progress.target) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Points */}
        <div className={cn("font-medium text-primary", currentSize.points)}>
          +{achievement.points} pontos
        </div>

        {/* Unlock date */}
        {isUnlocked && achievement.unlockedAt && (
          <p className="text-xs text-muted-foreground">
            Desbloqueado em {achievement.unlockedAt.toLocaleDateString("pt-BR")}
          </p>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// PROGRESS COMPONENTS
// =============================================================================

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: "default" | "gradient" | "striped";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  variant = "default",
  size = "md",
  className = "",
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const sizes = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const variants = {
    default: "bg-primary",
    gradient: "bg-gradient-to-r from-blue-500 to-purple-500",
    striped: "bg-primary bg-stripes",
  };

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center text-sm">
          {label && <span className="font-medium">{label}</span>}
          {showPercentage && (
            <span className="text-muted-foreground">{Math.round(percentage)}%</span>
          )}
        </div>
      )}

      <div className={cn("w-full bg-secondary rounded-full overflow-hidden", sizes[size])}>
        <motion.div
          className={cn("h-full rounded-full transition-all duration-500", variants[variant])}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// =============================================================================
// EMPTY STATE COMPONENT
// =============================================================================

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  const { isMobile } = useResponsive();

  return (
    <div
      className={cn("flex flex-col items-center justify-center text-center py-12 px-4", className)}
    >
      {icon && (
        <div className={cn("text-muted-foreground mb-4", isMobile ? "text-4xl" : "text-6xl")}>
          {icon}
        </div>
      )}

      <h3 className={cn("font-semibold text-foreground mb-2", isMobile ? "text-base" : "text-lg")}>
        {title}
      </h3>

      {description && (
        <p
          className={cn("text-muted-foreground mb-6 max-w-md", isMobile ? "text-sm" : "text-base")}
        >
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            "px-4 py-2 bg-primary text-primary-foreground rounded-md",
            "hover:bg-primary/90 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            isMobile && "min-h-[44px]"
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
