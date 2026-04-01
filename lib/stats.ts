import type { GameResult } from "./gameSimulator";

export interface BatchStats {
  mean: number;
  std: number;
  min: number;
  max: number;
  strikeRate: number;
  spareRate: number;
  distribution: { binStart: number; binEnd: number; count: number }[];
}

function meanStd(scores: number[]): { mean: number; std: number } {
  if (scores.length === 0) return { mean: 0, std: 0 };
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const v =
    scores.reduce((s, x) => s + (x - mean) ** 2, 0) /
    Math.max(1, scores.length);
  return { mean, std: Math.sqrt(v) };
}

/** Strike/spare rates from frames 1–9 only (standard analytics slice). */
export function summarizeGames(games: GameResult[]): BatchStats {
  const scores = games.map((g) => g.total_score);
  const { mean, std } = meanStd(scores);
  const min = scores.length ? Math.min(...scores) : 0;
  const max = scores.length ? Math.max(...scores) : 0;

  let strikeOpp = 0;
  let strikes = 0;
  let spareOpp = 0;
  let spares = 0;

  for (const g of games) {
    for (let i = 0; i < 9; i++) {
      const f = g.frames[i];
      strikeOpp++;
      if (f.is_strike) strikes++;
      else {
        spareOpp++;
        if (f.is_spare) spares++;
      }
    }
  }

  const strikeRate = strikeOpp ? strikes / strikeOpp : 0;
  const spareRate = spareOpp ? spares / spareOpp : 0;

  const binWidth = 20;
  const bins = new Map<number, number>();
  for (const s of scores) {
    const b = Math.floor(s / binWidth) * binWidth;
    bins.set(b, (bins.get(b) ?? 0) + 1);
  }
  const sortedBins = [...bins.entries()].sort((a, b) => a[0] - b[0]);
  const distribution = sortedBins.map(([start, count]) => ({
    binStart: start,
    binEnd: start + binWidth,
    count,
  }));

  return {
    mean,
    std,
    min,
    max,
    strikeRate,
    spareRate,
    distribution,
  };
}
