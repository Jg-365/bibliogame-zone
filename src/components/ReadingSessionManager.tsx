import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import {
  Calendar,
  BookOpen,
  Minus,
  Trash2,
  RotateCcw,
  Clock,
} from "lucide-react";

export const ReadingSessionManager = () => {
  const {
    sessions,
    todaySessions,
    isLoading,
    removePages,
    deleteSession,
    resetTodayActivities,
    isRemovingPages,
    isDeletingSession,
    isResettingToday,
  } = useReadingSessions();

  const [pagesToRemove, setPagesToRemove] = useState<
    Record<string, number>
  >({});

  const handleRemovePages = (sessionId: string) => {
    const pages = pagesToRemove[sessionId];
    if (pages && pages > 0) {
      removePages({ sessionId, pagesToRemove: pages });
      setPagesToRemove((prev) => ({
        ...prev,
        [sessionId]: 0,
      }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
      }
    );
  };

  const todayTotalPages = todaySessions.reduce(
    (total, session) => total + session.pages_read,
    0
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Gerenciar Sessões de Leitura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Carregando sessões...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Atividades de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {todayTotalPages}
              </p>
              <p className="text-sm text-muted-foreground">
                páginas lidas hoje
              </p>
              <p className="text-sm text-muted-foreground">
                {todaySessions.length} sessão(ões)
              </p>
            </div>
            {todaySessions.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isResettingToday}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Resetar Hoje
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Resetar Atividades de Hoje
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso irá remover todas as{" "}
                      {todaySessions.length} sessão(ões) de
                      leitura de hoje, totalizando{" "}
                      {todayTotalPages} páginas. Esta ação
                      não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => resetTodayActivities()}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Resetar Tudo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {todaySessions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">
                Sessões de Hoje:
              </h4>
              {todaySessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-12 bg-primary/10 rounded flex-shrink-0 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {session.book?.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.book?.author}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {session.pages_read} páginas
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sessões Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma sessão de leitura encontrada.
            </p>
          ) : (
            <div className="space-y-4">
              {sessions.slice(0, 10).map((session) => (
                <div
                  key={session.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="w-12 h-16 bg-primary/10 rounded flex-shrink-0 flex items-center justify-center">
                        {session.book?.cover_url ? (
                          <img
                            src={session.book.cover_url}
                            alt={session.book.title}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <BookOpen className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">
                          {session.book?.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {session.book?.author}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge variant="outline">
                            {session.pages_read} páginas
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(
                              session.session_date
                            )}
                          </span>
                        </div>
                        {session.notes && (
                          <p className="text-sm mt-2 p-2 bg-muted/50 rounded italic">
                            "{session.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Remove Pages */}
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`pages-${session.id}`}
                        className="text-xs"
                      >
                        Remover páginas:
                      </Label>
                      <Input
                        id={`pages-${session.id}`}
                        type="number"
                        min="1"
                        max={session.pages_read}
                        value={
                          pagesToRemove[session.id] || ""
                        }
                        onChange={(e) =>
                          setPagesToRemove((prev) => ({
                            ...prev,
                            [session.id]:
                              parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-16 h-8"
                        placeholder="0"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleRemovePages(session.id)
                        }
                        disabled={
                          !pagesToRemove[session.id] ||
                          pagesToRemove[session.id] <= 0 ||
                          isRemovingPages
                        }
                      >
                        <Minus className="h-3 w-3 mr-1" />
                        Remover
                      </Button>
                    </div>

                    {/* Delete Session */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isDeletingSession}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Excluir Sessão
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir
                            esta sessão de leitura? Isso irá
                            remover {session.pages_read}{" "}
                            páginas do progresso do livro "
                            {session.book?.title}". Esta
                            ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              deleteSession(session.id)
                            }
                            className="bg-destructive text-destructive-foreground"
                          >
                            Excluir Sessão
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
