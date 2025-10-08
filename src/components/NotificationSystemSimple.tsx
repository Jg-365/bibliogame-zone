import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Bell, Check, X, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Notification types
export type NotificationType =
  | "achievement_unlocked"
  | "streak_milestone"
  | "book_completed"
  | "social_interaction"
  | "reading_reminder"
  | "weekly_summary"
  | "friend_activity";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  achievementNotifications: boolean;
  streakNotifications: boolean;
  socialNotifications: boolean;
  readingReminders: boolean;
  weeklyDigest: boolean;
  friendActivity: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  isLoading: boolean;
  addNotification: (notification: Omit<Notification, "id" | "createdAt" | "isRead">) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  deleteNotification: (notificationId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

// Default notification preferences
const defaultPreferences: NotificationPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  achievementNotifications: true,
  streakNotifications: true,
  socialNotifications: true,
  readingReminders: true,
  weeklyDigest: true,
  friendActivity: true,
};

interface NotificationProviderProps {
  children: ReactNode;
}

const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  // Load notifications and preferences from localStorage (temporary solution)
  useEffect(() => {
    if (!user?.id) return;

    loadNotifications();
    loadPreferences();
    setIsLoading(false);
  }, [user?.id]);

  const loadNotifications = () => {
    if (!user?.id) return;

    const stored = localStorage.getItem(`notifications_${user.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotifications(parsed);
      } catch (error) {
        console.error("Error parsing stored notifications:", error);
      }
    }
  };

  const saveNotifications = (newNotifications: Notification[]) => {
    if (!user?.id) return;

    localStorage.setItem(`notifications_${user.id}`, JSON.stringify(newNotifications));
    setNotifications(newNotifications);
  };

  const loadPreferences = () => {
    if (!user?.id) return;

    const stored = localStorage.getItem(`notification_preferences_${user.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch (error) {
        console.error("Error parsing stored preferences:", error);
      }
    }
  };

  const savePreferences = (newPreferences: NotificationPreferences) => {
    if (!user?.id) return;

    localStorage.setItem(`notification_preferences_${user.id}`, JSON.stringify(newPreferences));
    setPreferences(newPreferences);
  };

  const addNotification = (notificationData: Omit<Notification, "id" | "createdAt" | "isRead">) => {
    if (!user?.id) return;

    const newNotification: Notification = {
      ...notificationData,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    const updatedNotifications = [newNotification, ...notifications].slice(0, 50);
    saveNotifications(updatedNotifications);

    // Show toast notification if enabled
    if (preferences.pushNotifications) {
      toast({
        title: newNotification.title,
        description: newNotification.message,
        duration: 5000,
      });
    }
  };

  const markAsRead = (notificationId: string) => {
    const updatedNotifications = notifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    saveNotifications(updatedNotifications);
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
    saveNotifications(updatedNotifications);
  };

  const deleteNotification = (notificationId: string) => {
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    saveNotifications(updatedNotifications);
  };

  const updatePreferences = (newPreferences: Partial<NotificationPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    savePreferences(updatedPreferences);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    preferences,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>{children}</NotificationContext.Provider>
  );
};

// Notification Bell Component
export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "achievement_unlocked":
        return "🏆";
      case "streak_milestone":
        return "🔥";
      case "book_completed":
        return "📚";
      case "social_interaction":
        return "👥";
      case "reading_reminder":
        return "⏰";
      case "weekly_summary":
        return "📊";
      case "friend_activity":
        return "👋";
      default:
        return "🔔";
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Agora";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md max-h-[600px] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Notificações</span>
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                Marcar todas como lidas
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map(notification => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`p-3 rounded-lg border transition-colors ${
                      notification.isRead
                        ? "bg-background hover:bg-accent/50"
                        : "bg-primary/5 border-primary/20 hover:bg-primary/10"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-lg flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm leading-tight">
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-xs text-muted-foreground">
                              {formatTime(notification.createdAt)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-6 w-6 p-0 hover:bg-destructive/10"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mt-1 leading-tight">
                          {notification.message}
                        </p>

                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-6 mt-2 text-xs text-primary hover:text-primary"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Marcar como lida
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Notification Settings Component
export const NotificationSettings: React.FC = () => {
  const { preferences, updatePreferences } = useNotifications();

  const settingsGroups = [
    {
      title: "Notificações Gerais",
      settings: [
        {
          key: "emailNotifications" as keyof NotificationPreferences,
          label: "Notificações por e-mail",
          description: "Receba notificações importantes no seu e-mail",
        },
        {
          key: "pushNotifications" as keyof NotificationPreferences,
          label: "Notificações push",
          description: "Notificações instantâneas no navegador",
        },
      ],
    },
    {
      title: "Atividades de Leitura",
      settings: [
        {
          key: "achievementNotifications" as keyof NotificationPreferences,
          label: "Conquistas desbloqueadas",
          description: "Seja notificado quando desbloquear uma nova conquista",
        },
        {
          key: "streakNotifications" as keyof NotificationPreferences,
          label: "Marcos de sequência",
          description: "Celebre seus marcos de leitura consecutiva",
        },
        {
          key: "readingReminders" as keyof NotificationPreferences,
          label: "Lembretes de leitura",
          description: "Lembretes para manter sua rotina de leitura",
        },
      ],
    },
    {
      title: "Atividades Sociais",
      settings: [
        {
          key: "socialNotifications" as keyof NotificationPreferences,
          label: "Interações sociais",
          description: "Curtidas, comentários e menções",
        },
        {
          key: "friendActivity" as keyof NotificationPreferences,
          label: "Atividade de amigos",
          description: "Quando seus amigos completam livros ou desbloqueiam conquistas",
        },
      ],
    },
    {
      title: "Resumos",
      settings: [
        {
          key: "weeklyDigest" as keyof NotificationPreferences,
          label: "Resumo semanal",
          description: "Resumo das suas atividades de leitura da semana",
        },
      ],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configurações de Notificação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {settingsGroups.map(group => (
          <div key={group.title} className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {group.title}
            </h4>
            <div className="space-y-4">
              {group.settings.map(setting => (
                <div key={setting.key} className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor={setting.key} className="font-medium">
                      {setting.label}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{setting.description}</p>
                  </div>
                  <Switch
                    id={setting.key}
                    checked={preferences[setting.key]}
                    onCheckedChange={checked => updatePreferences({ [setting.key]: checked })}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// Hook to trigger notifications for specific events
export const useNotificationTriggers = () => {
  const { addNotification, preferences } = useNotifications();

  const triggerAchievementNotification = (
    achievementTitle: string,
    achievementDescription: string
  ) => {
    if (!preferences.achievementNotifications) return;

    addNotification({
      type: "achievement_unlocked",
      title: "🏆 Nova conquista desbloqueada!",
      message: `Parabéns! Você desbloqueou a conquista "${achievementTitle}"`,
      metadata: { achievementTitle, achievementDescription },
    });
  };

  const triggerStreakNotification = (streakDays: number) => {
    if (!preferences.streakNotifications) return;

    addNotification({
      type: "streak_milestone",
      title: "🔥 Marco de sequência alcançado!",
      message: `Incrível! Você manteve sua sequência de leitura por ${streakDays} dia(s) consecutivos!`,
      metadata: { streakDays },
    });
  };

  const triggerBookCompletedNotification = (bookTitle: string) => {
    if (!preferences.achievementNotifications) return;

    addNotification({
      type: "book_completed",
      title: "📚 Livro concluído!",
      message: `Parabéns por concluir "${bookTitle}"!`,
      metadata: { bookTitle },
    });
  };

  const triggerReadingReminder = () => {
    if (!preferences.readingReminders) return;

    addNotification({
      type: "reading_reminder",
      title: "📚 Hora de ler!",
      message: "Que tal retomar sua jornada de leitura hoje?",
      metadata: { reminderType: "daily" },
    });
  };

  return {
    triggerAchievementNotification,
    triggerStreakNotification,
    triggerBookCompletedNotification,
    triggerReadingReminder,
  };
};

// Default export for the notification system
export default NotificationProvider;
