import React from "react";
import { SocialSection } from "@/components/SocialSection";
import { Leaderboard } from "@/components/Leaderboard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Trophy } from "lucide-react";

export const SocialFeedPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">🌟 Comunidade de Leitores</h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Compartilhe e conecte-se com outros leitores
          </p>
        </div>

        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto max-w-md mx-auto">
            <TabsTrigger
              value="feed"
              className="flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base py-2.5 sm:py-3"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden xs:inline">Posts</span>
              <span className="xs:hidden">📰</span>
            </TabsTrigger>
            <TabsTrigger
              value="ranking"
              className="flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base py-2.5 sm:py-3"
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden xs:inline">Ranking</span>
              <span className="xs:hidden">🏆</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-6 sm:mt-8 focus-visible:outline-none">
            <div className="space-y-6">
              {/* Activity Feed da última semana */}
              <ActivityFeed limit={15} />

              {/* Social Section com posts */}
              <SocialSection />
            </div>
          </TabsContent>

          <TabsContent value="ranking" className="mt-6 sm:mt-8 focus-visible:outline-none">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SocialFeedPage;
