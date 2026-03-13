import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SocialSection } from "@/components/SocialSection";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Leaderboard } from "@/components/Leaderboard";
import { PageHeader, PageSection, PageShell } from "@/components/layout/PageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeaderboard } from "@/hooks/social";
import { Compass, TrendingUp, Trophy } from "lucide-react";

export const SocialFeedPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"feed" | "ranking">("feed");
  useLeaderboard();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    setActiveTab(searchParams.get("tab") === "ranking" ? "ranking" : "feed");
  }, [location.search]);

  const handleTabChange = (tab: string) => {
    const value = tab as "feed" | "ranking";
    setActiveTab(value);

    navigate(
      {
        pathname: "/social-feed",
        search: value === "ranking" ? "?tab=ranking" : "",
      },
      { replace: true },
    );
  };

  return (
    <PageShell containerClassName="max-w-5xl space-y-6">
      <PageHeader
        icon={Compass}
        title="Comunidade de leitores"
        description="Compartilhe sua jornada, acompanhe atividades e descubra leitores em destaque."
      />

      <PageSection>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-[var(--radius-lg)] p-1 sm:max-w-md">
            <TabsTrigger
              value="feed"
              className="flex items-center justify-center gap-1.5 py-2.5 text-sm sm:gap-2 sm:text-base"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Feed</span>
            </TabsTrigger>
            <TabsTrigger
              value="ranking"
              className="flex items-center justify-center gap-1.5 py-2.5 text-sm sm:gap-2 sm:text-base"
            >
              <Trophy className="h-4 w-4" />
              <span>Ranking</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed" className="mt-6 space-y-6 focus-visible:outline-none">
            <ActivityFeed limit={15} />
            <SocialSection />
          </TabsContent>

          <TabsContent value="ranking" className="mt-6 focus-visible:outline-none">
            <Leaderboard />
          </TabsContent>
        </Tabs>
      </PageSection>
    </PageShell>
  );
};

export default SocialFeedPage;
