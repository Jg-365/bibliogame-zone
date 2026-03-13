/**
 * Smoke tests for social/graph utilities.
 * These test pure logic in isolation — no Supabase calls.
 */

// The ranking logic embedded in useLeaderboard: sort by points, assign rank 1..n
function rankEntries(
  entries: Array<{ userId: string; points: number }>,
): Array<{ userId: string; points: number; rank: number }> {
  return [...entries]
    .sort((a, b) => b.points - a.points)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

describe("rankEntries", () => {
  it("returns an empty array for empty input", () => {
    expect(rankEntries([])).toEqual([]);
  });

  it("assigns rank 1 to the highest scorer", () => {
    const result = rankEntries([
      { userId: "a", points: 100 },
      { userId: "b", points: 300 },
      { userId: "c", points: 200 },
    ]);
    expect(result[0]).toMatchObject({
      userId: "b",
      rank: 1,
    });
  });

  it("assigns sequential ranks", () => {
    const result = rankEntries([
      { userId: "x", points: 50 },
      { userId: "y", points: 150 },
    ]);
    expect(result.map((r) => r.rank)).toEqual([1, 2]);
  });

  it("does not mutate the original array", () => {
    const original = [
      { userId: "a", points: 10 },
      { userId: "b", points: 20 },
    ];
    rankEntries(original);
    expect(original[0].userId).toBe("a");
  });
});
