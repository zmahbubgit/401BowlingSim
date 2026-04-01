export interface Frame {
  frame_number: number;
  rolls: number[];
  frame_score: number;
  cumulative_score: number;
  is_strike: boolean;
  is_spare: boolean;
}

export function calculateScore(allRolls: number[]): Frame[] {
  const frames: Frame[] = [];
  let rollIndex = 0;
  let cumulative = 0;

  for (let f = 0; f < 10; f++) {
    const frameNumber = f + 1;
    const isLast = f === 9;

    if (!isLast) {
      const r1 = allRolls[rollIndex];
      const isStrike = r1 === 10;

      if (isStrike) {
        const bonus1 = allRolls[rollIndex + 1] ?? 0;
        const bonus2 = allRolls[rollIndex + 2] ?? 0;
        const score = 10 + bonus1 + bonus2;
        cumulative += score;
        frames.push({
          frame_number: frameNumber,
          rolls: [10],
          frame_score: score,
          cumulative_score: cumulative,
          is_strike: true,
          is_spare: false,
        });
        rollIndex += 1;
      } else {
        const r2 = allRolls[rollIndex + 1] ?? 0;
        const isSpare = r1 + r2 === 10;
        const bonus = isSpare ? (allRolls[rollIndex + 2] ?? 0) : 0;
        const score = r1 + r2 + bonus;
        cumulative += score;
        frames.push({
          frame_number: frameNumber,
          rolls: [r1, r2],
          frame_score: score,
          cumulative_score: cumulative,
          is_strike: false,
          is_spare: isSpare,
        });
        rollIndex += 2;
      }
    } else {
      const r1 = allRolls[rollIndex] ?? 0;
      const r2 = allRolls[rollIndex + 1] ?? 0;
      const r3 = allRolls[rollIndex + 2];
      const rolls = r3 !== undefined ? [r1, r2, r3] : [r1, r2];
      const score = rolls.reduce((a, b) => a + b, 0);
      cumulative += score;
      frames.push({
        frame_number: 10,
        rolls,
        frame_score: score,
        cumulative_score: cumulative,
        is_strike: r1 === 10,
        is_spare: r1 !== 10 && r1 + r2 === 10,
      });
    }
  }

  return frames;
}
