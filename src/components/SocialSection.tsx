import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Leaderboard } from "@/components/Leaderboard";
import { Users, TrendingUp } from "lucide-react";

export const SocialSection: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          Área Social
        </h1>
        <p className="text-muted-foreground">
          Veja o progresso dos leitores e acompanhe as atividades da comunidade
        </p>
      </div>

      {/* Social Content */}
      <div className="grid md:grid-cols-2 gap-6">
        <ActivityFeed />
        <Leaderboard />
      </div>

      {/* Coming Soon Section */}
      <Card className="border-dashed border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle>Novidades em Breve!</CardTitle>
          <CardDescription>
            Em desenvolvimento: sistema de posts, seguir usuários, comentários e muito mais!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              Posts sobre leituras
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              Sistema de seguir amigos
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              Comentários e curtidas
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              Grupos de leitura
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
