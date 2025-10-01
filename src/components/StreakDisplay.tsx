import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Flame,
  Calendar,
  Target,
  Trophy,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import { cn } from "@/lib/utils";

interface StreakDisplayProps {
  className?: string;
}

export const StreakDisplay = ({
  className,
}: StreakDisplayProps) => {
  const { profile } = useProfile();
  const { sessions } = useReadingSessions();
  const [showStreakAnimation, setShowStreakAnimation] =
    useState(false);
  const [lastStreak, setLastStreak] = useState(0);

  const currentStreak =
    (profile as any)?.reading_streak || 0;
  const longestStreak = (profile as any)?.best_streak || 0;

  // Detect streak increase for animation
  useEffect(() => {
    if (currentStreak > lastStreak && lastStreak > 0) {
      setShowStreakAnimation(true);
      const timer = setTimeout(
        () => setShowStreakAnimation(false),
        3000
      );
      return () => clearTimeout(timer);
    }
    setLastStreak(currentStreak);
  }, [currentStreak, lastStreak]);

  // Check if user read today
  const hasReadToday = sessions?.some((session) => {
    const today = new Date().toDateString();
    const sessionDate = new Date(
      session.session_date
    ).toDateString();
    return sessionDate === today && session.pages_read > 0;
  });

  // Calculate days for visual representation
  const getStreakDays = () => {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const hasSession = sessions?.some((session) => {
        const sessionDate = new Date(
          session.session_date
        ).toDateString();
        return (
          sessionDate === date.toDateString() &&
          session.pages_read > 0
        );
      });

      days.push({
        date,
        hasSession,
        isToday: i === 0,
      });
    }

    return days;
  };

  const streakDays = getStreakDays();

  const getStreakMessage = () => {
    if (currentStreak === 0) {
      return "Comece sua sequência hoje! 🚀";
    } else if (currentStreak === 1) {
      return "Ótimo começo! Continue assim! 💪";
    } else if (currentStreak < 7) {
      return `${currentStreak} dias seguidos! Você está no caminho certo! 🔥`;
    } else if (currentStreak < 30) {
      return `${currentStreak} dias seguidos! Incrível dedicação! 🌟`;
    } else {
      return `${currentStreak} dias seguidos! Você é uma lenda! 👑`;
    }
  };

  const getStreakColor = () => {
    if (currentStreak === 0) return "text-muted-foreground";
    if (currentStreak < 7) return "text-orange-500";
    if (currentStreak < 30) return "text-red-500";
    return "text-purple-500";
  };

  const getStreakBadgeVariant = () => {
    if (currentStreak === 0) return "secondary";
    if (currentStreak < 7) return "default";
    if (currentStreak < 30) return "destructive";
    return "default";
  };

  return (
    <Card
      className={cn("relative overflow-hidden", className)}
    >
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.div
                animate={
                  currentStreak > 0
                    ? {
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0],
                      }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Flame
                  className={cn(
                    "w-5 h-5",
                    getStreakColor()
                  )}
                />
              </motion.div>
              <h3 className="font-semibold">
                Sequência de Leitura
              </h3>
            </div>
            <Badge
              variant={getStreakBadgeVariant()}
              className="px-3"
            >
              {currentStreak} dias
            </Badge>
          </div>

          {/* Streak Counter */}
          <div className="text-center space-y-2">
            <motion.div
              key={currentStreak}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              className={cn(
                "text-4xl font-bold",
                getStreakColor()
              )}
            >
              {currentStreak}
            </motion.div>
            <p className="text-sm text-muted-foreground">
              {getStreakMessage()}
            </p>
          </div>

          {/* Week View */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Últimos 7 dias
              </span>
              {longestStreak > 0 && (
                <span className="text-muted-foreground">
                  Recorde: {longestStreak} dias
                </span>
              )}
            </div>

            <div className="flex justify-between gap-1">
              {streakDays.map((day, index) => (
                <motion.div
                  key={day.date.toISOString()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center space-y-1"
                >
                  <div className="text-xs text-muted-foreground">
                    {day.date.toLocaleDateString("pt-BR", {
                      weekday: "short",
                    })}
                  </div>
                  <motion.div
                    className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center",
                      day.hasSession
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted bg-muted/30",
                      day.isToday &&
                        "ring-2 ring-primary ring-offset-2"
                    )}
                    whileHover={{ scale: 1.1 }}
                    animate={
                      day.hasSession
                        ? {
                            boxShadow: [
                              "0 0 0 0 rgba(59, 130, 246, 0.4)",
                              "0 0 0 10px rgba(59, 130, 246, 0)",
                              "0 0 0 0 rgba(59, 130, 246, 0)",
                            ],
                          }
                        : {}
                    }
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                    }}
                  >
                    {day.hasSession ? (
                      <Flame className="w-3 h-3" />
                    ) : (
                      <div className="w-2 h-2 bg-muted-foreground/30 rounded-full" />
                    )}
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          {!hasReadToday && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20"
            >
              <p className="text-sm text-primary font-medium mb-2">
                {currentStreak > 0
                  ? "Continue sua sequência!"
                  : "Comece sua sequência hoje!"}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
              >
                <Target className="w-3 h-3 mr-1" />
                Registrar Leitura
              </Button>
            </motion.div>
          )}

          {/* Streak Milestone Animation */}
          <AnimatePresence>
            {showStreakAnimation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: -20 }}
                className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm"
              >
                <div className="text-center space-y-2">
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 1 }}
                  >
                    <Trophy className="w-12 h-12 text-yellow-500 mx-auto" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <p className="text-lg font-bold text-primary">
                      Sequência Aumentada!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentStreak} dias seguidos! 🎉
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};
