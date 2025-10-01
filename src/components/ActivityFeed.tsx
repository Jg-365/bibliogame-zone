import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Flame } from "lucide-react";

export const ActivityFeed = () => {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Flame className="h-5 w-5 text-orange-500" />
          Feed de Atividades
        </CardTitle>
        <CardDescription className="text-slate-600">
          Atividades recentes da sua rede de contatos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-slate-500">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <p className="mb-2 font-medium">Nenhuma atividade recente</p>
          <p className="text-sm text-slate-400">
            Complete livros e desbloqueie conquistas para ver suas atividades aqui!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
