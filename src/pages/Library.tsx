import React from "react";
import { Library } from "lucide-react";
import { BookLibrary } from "@/components/BookLibrary";
import { BookActionButtons } from "@/components/BookActionButtons";
import { useBooks } from "@/hooks/useBooks";
import { useAuth } from "@/hooks/useAuth";
import { useReadingSessions } from "@/hooks/useReadingSessions";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PageSection, PageShell } from "@/components/layout/PageLayout";
import { useFeatureFlags } from "@/lib/featureFlags";
import { ResumeReadingCard } from "@/features/library/components/ResumeReadingCard";
import { WeeklyGoalCard } from "@/features/library/components/WeeklyGoalCard";
import { FocusTimerCard } from "@/features/library/components/FocusTimerCard";
import { AIReadingCopilotCard } from "@/features/library/components/AIReadingCopilotCard";
import { SmartRecommendationsCard } from "@/features/library/components/SmartRecommendationsCard";

export const LibraryPage = () => {
  const { user } = useAuth();
  const { books = [] } = useBooks();
  const { sessions = [] } = useReadingSessions();
  const flags = useFeatureFlags();
  const total = books?.length || 0;

  return (
    <PageShell containerClassName="max-w-7xl space-y-6" density="compact">
      <PageHeader
        icon={Library}
        title="Minha biblioteca"
        description="Organize sua coleção, acompanhe progresso e evolua sua consistência de leitura."
        actions={
          <Badge variant="secondary" className="text-xs sm:text-sm">
            {total} {total === 1 ? "livro" : "livros"}
          </Badge>
        }
      />

      <PageSection>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ResumeReadingCard books={books} />
          {flags.enableWeeklyGoal ? <WeeklyGoalCard sessions={sessions} /> : null}
          {flags.enableReadingFocusTimer ? <FocusTimerCard /> : null}
          {flags.enableAiCopilot ? <AIReadingCopilotCard userId={user?.id} books={books} /> : null}
          {flags.enableSmartRecommendations ? <SmartRecommendationsCard books={books} /> : null}
        </div>

        <BookActionButtons />
        <BookLibrary />
      </PageSection>
    </PageShell>
  );
};

export default LibraryPage;
