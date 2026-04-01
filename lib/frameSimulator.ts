import { createRNG } from "./rng";

export interface FrameResult {
  skill: number;
  seed: number;
  is_last_frame: boolean;
  roll1: number;
  roll2?: number;
  roll3?: number;
}

export function simulateFrame(
  skill: number,
  seed: number,
  isLastFrame: boolean
): FrameResult {
  const rng = createRNG(seed);
  return simulateFrameWithRNG(skill, seed, isLastFrame, rng);
}

export function simulateFrameWithRNG(
  skill: number,
  seed: number,
  isLastFrame: boolean,
  rng: () => number
): FrameResult {
  const strikeProb = Math.pow(skill, 1.5);
  const isStrike = rng() < strikeProb;

  if (isStrike) {
    if (!isLastFrame) {
      return { skill, seed, is_last_frame: false, roll1: 10 };
    }
    const r2raw = rng() < strikeProb;
    const roll2 = r2raw
      ? 10
      : Math.min(9, Math.floor(rng() * 10 * (0.4 + 0.6 * skill)));
    let roll3: number;
    if (roll2 === 10) {
      roll3 = rng() < strikeProb
        ? 10
        : Math.min(9, Math.floor(rng() * 10 * (0.4 + 0.6 * skill)));
    } else {
      const spareProb = skill * 0.85;
      roll3 =
        rng() < spareProb
          ? 10 - roll2
          : Math.floor(rng() * (10 - roll2) * skill);
    }
    return { skill, seed, is_last_frame: true, roll1: 10, roll2, roll3 };
  }

  const pins1 = Math.min(
    9,
    Math.max(0, Math.floor(rng() * 10 * (0.4 + 0.6 * skill)))
  );
  const remaining = 10 - pins1;
  const spareProb = skill * 0.85;
  const isSpare = rng() < spareProb;
  const pins2 = isSpare ? remaining : Math.floor(rng() * remaining * skill);

  if (!isLastFrame) {
    return { skill, seed, is_last_frame: false, roll1: pins1, roll2: pins2 };
  }

  if (isSpare) {
    const r3Strike = rng() < strikeProb;
    const roll3 = r3Strike
      ? 10
      : Math.min(9, Math.floor(rng() * 10 * (0.4 + 0.6 * skill)));
    return { skill, seed, is_last_frame: true, roll1: pins1, roll2: pins2, roll3 };
  }

  return { skill, seed, is_last_frame: true, roll1: pins1, roll2: pins2 };
}
