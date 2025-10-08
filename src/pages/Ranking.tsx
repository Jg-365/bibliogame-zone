import { Leaderboard } from "@/components/Leaderboard";

const RankingPage = () => {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🏆 Ranking Global</h1>
        <p className="text-muted-foreground">
          Compete com outros leitores e veja sua posição!
        </p>
      </div>
      <Leaderboard />
    </div>
  );
};

export default RankingPage;
