import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Mail, Heart, MessageCircle, UserPlus, BookOpen, Clock } from "lucide-react";

interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications_enabled: boolean;
  notify_on_follow: boolean;
  notify_on_comment: boolean;
  notify_on_like: boolean;
  notify_on_post: boolean;
  daily_reading_reminder: boolean;
  reminder_time: string;
}

export function NotificationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reminderTime, setReminderTime] = useState("20:00");

  // Fetch current preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // Create default preferences if they don't exist
        if (error.code === "PGRST116") {
          const { data: newPrefs, error: insertError } = await supabase
            .from("notification_preferences")
            .insert({
              user_id: user.id,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          return newPrefs;
        }
        throw error;
      }

      setReminderTime(data.reminder_time.slice(0, 5)); // HH:MM
      return data;
    },
  });

  // Update preferences mutation
  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("notification_preferences")
        .update(updates)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast({
        title: "Preferências atualizadas",
        description: "Suas configurações de notificação foram salvas.",
      });
    },
    onError: error => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggle = (field: keyof NotificationPreferences, value: boolean) => {
    updatePreferences.mutate({ [field]: value });
  };

  const handleTimeUpdate = () => {
    updatePreferences.mutate({ reminder_time: `${reminderTime}:00` });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Carregando preferências...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Master Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Notificações por E-mail
          </CardTitle>
          <CardDescription>
            Receba atualizações importantes diretamente no seu e-mail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-enabled" className="text-base font-medium">
                Habilitar notificações por e-mail
              </Label>
              <p className="text-sm text-muted-foreground">
                Ative ou desative todas as notificações por e-mail
              </p>
            </div>
            <Switch
              id="email-enabled"
              checked={preferences?.email_notifications_enabled ?? true}
              onCheckedChange={checked => handleToggle("email_notifications_enabled", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Atividades Sociais
          </CardTitle>
          <CardDescription>
            Seja notificado quando pessoas que você segue interagirem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* New Follower */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="notify-follow" className="text-base font-medium">
                  Novos seguidores
                </Label>
                <p className="text-sm text-muted-foreground">Quando alguém começar a seguir você</p>
              </div>
            </div>
            <Switch
              id="notify-follow"
              checked={preferences?.notify_on_follow ?? true}
              onCheckedChange={checked => handleToggle("notify_on_follow", checked)}
              disabled={!preferences?.email_notifications_enabled}
            />
          </div>

          {/* New Post */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="notify-post" className="text-base font-medium">
                  Novas publicações
                </Label>
                <p className="text-sm text-muted-foreground">
                  Quando pessoas que você segue publicarem algo
                </p>
              </div>
            </div>
            <Switch
              id="notify-post"
              checked={preferences?.notify_on_post ?? true}
              onCheckedChange={checked => handleToggle("notify_on_post", checked)}
              disabled={!preferences?.email_notifications_enabled}
            />
          </div>

          {/* Comments */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="notify-comment" className="text-base font-medium">
                  Comentários
                </Label>
                <p className="text-sm text-muted-foreground">
                  Quando comentarem em suas publicações
                </p>
              </div>
            </div>
            <Switch
              id="notify-comment"
              checked={preferences?.notify_on_comment ?? true}
              onCheckedChange={checked => handleToggle("notify_on_comment", checked)}
              disabled={!preferences?.email_notifications_enabled}
            />
          </div>

          {/* Likes */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <Label htmlFor="notify-like" className="text-base font-medium">
                  Curtidas
                </Label>
                <p className="text-sm text-muted-foreground">Quando curtirem suas publicações</p>
              </div>
            </div>
            <Switch
              id="notify-like"
              checked={preferences?.notify_on_like ?? true}
              onCheckedChange={checked => handleToggle("notify_on_like", checked)}
              disabled={!preferences?.email_notifications_enabled}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reading Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Lembretes de Leitura
          </CardTitle>
          <CardDescription>
            Receba um lembrete diário para manter sua sequência ativa
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reading-reminder" className="text-base font-medium">
                Lembrete diário de leitura
              </Label>
              <p className="text-sm text-muted-foreground">
                Receba um e-mail diário lembrando de ler
              </p>
            </div>
            <Switch
              id="reading-reminder"
              checked={preferences?.daily_reading_reminder ?? true}
              onCheckedChange={checked => handleToggle("daily_reading_reminder", checked)}
              disabled={!preferences?.email_notifications_enabled}
            />
          </div>

          {preferences?.daily_reading_reminder && (
            <div className="space-y-2 pt-2 border-t">
              <Label htmlFor="reminder-time" className="text-sm font-medium">
                Horário do lembrete
              </Label>
              <div className="flex gap-2">
                <Input
                  id="reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={e => setReminderTime(e.target.value)}
                  className="w-40"
                  disabled={!preferences?.email_notifications_enabled}
                />
                <Button
                  onClick={handleTimeUpdate}
                  disabled={
                    !preferences?.email_notifications_enabled ||
                    reminderTime === preferences?.reminder_time.slice(0, 5)
                  }
                >
                  Salvar horário
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Você receberá um e-mail todos os dias neste horário caso não tenha lido ainda
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Sobre as notificações por e-mail
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Todos os e-mails incluem links diretos para o conteúdo relevante no site. Você pode
                ajustar suas preferências a qualquer momento e os e-mails incluem um link para
                desativar notificações específicas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
