import { createRNG } from "./rng";
import { simulateFrameWithRNG } from "./frameSimulator";
import { calculateScore } from "./scoring";

export interface GameResult {
  skill: number;
  seed: number;
  total_score: number;
  frames: ReturnType<typeof calculateScore>;
  all_rolls: number[];
}

export function simulateGame(skill: number, seed: number): GameResult {
  const rng = createRNG(seed);
  const allRolls: number[] = [];

  for (let f = 0; f < 9; f++) {
    const frame = simulateFrameWithRNG(skill, seed, false, rng);
    allRolls.push(frame.roll1);
    if (frame.roll2 !== undefined) allRolls.push(frame.roll2);
  }

  const lastFrame = simulateFrameWithRNG(skill, seed, true, rng);
  allRolls.push(lastFrame.roll1);
  if (lastFrame.roll2 !== undefined) allRolls.push(lastFrame.roll2);
  if (lastFrame.roll3 !== undefined) allRolls.push(lastFrame.roll3);

  const frames = calculateScore(allRolls);
  const total_score = frames[9].cumulative_score;

  return { skill, seed, total_score, frames, all_rolls: allRolls };
}
