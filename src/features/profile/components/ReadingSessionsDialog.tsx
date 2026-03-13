import React from "react";
import { m, AnimatePresence } from "framer-motion";
import { Book, BookOpen, Calendar, Trash } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ReadingSession } from "@/hooks/useReadingSessions";

interface ReadingSessionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: ReadingSession[];
  isDeletingSession: boolean;
  onDeleteSession: (sessionId: string) => void;
}

export const ReadingSessionsDialog = ({
  open,
  onOpenChange,
  sessions,
  isDeletingSession,
  onDeleteSession,
}: ReadingSessionsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            Sessões de leitura
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {sessions.length > 0 ? (
            <AnimatePresence>
              {sessions.map((session, index) => (
                <m.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(session.session_date), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </div>

                          <Badge variant="secondary">{session.pages_read} páginas lidas</Badge>

                          {session.notes ? (
                            <p className="mt-2 text-sm text-muted-foreground">{session.notes}</p>
                          ) : null}
                        </div>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const ok = window.confirm(
                              "Remover esta sessão de leitura? Esta ação atualizará o livro e removerá as páginas registradas.",
                            );
                            if (!ok) return;
                            onDeleteSession(session.id);
                          }}
                          disabled={isDeletingSession}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </m.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Nenhuma sessão de leitura registrada para este livro.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
