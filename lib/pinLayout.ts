import type { FrameResult } from "./frameSimulator";

/** Front-to-back knock order for visualization */
export const PIN_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function knockFromRack(standing: Set<number>, count: number): number[] {
  const knocked: number[] = [];
  for (const p of PIN_ORDER) {
    if (knocked.length >= count) break;
    if (standing.has(p)) {
      standing.delete(p);
      knocked.push(p);
    }
  }
  return knocked;
}

/** All pins knocked on current rack after each roll (10th frame resets rack after strikes / before fill). */
export function frameResultToKnockedByRoll(result: FrameResult): number[][] {
  const byRoll: number[][] = [];
  if (!result.is_last_frame) {
    const standing = new Set<number>(PIN_ORDER);
    if (result.roll1 === 10) {
      byRoll.push(knockFromRack(standing, 10));
      return byRoll;
    }
    byRoll.push(knockFromRack(standing, result.roll1));
    if (result.roll2 !== undefined) {
      byRoll.push(knockFromRack(standing, result.roll2));
    }
    return byRoll;
  }

  let standing = new Set<number>(PIN_ORDER);
  if (result.roll1 === 10) {
    byRoll.push(knockFromRack(standing, 10));
    standing = new Set<number>(PIN_ORDER);
    const r2 = result.roll2 ?? 0;
    if (r2 === 10) {
      byRoll.push(knockFromRack(standing, 10));
      standing = new Set<number>(PIN_ORDER);
      if (result.roll3 !== undefined) {
        byRoll.push(knockFromRack(standing, result.roll3));
      }
    } else {
      byRoll.push(knockFromRack(standing, r2));
      if (result.roll3 !== undefined) {
        byRoll.push(knockFromRack(standing, result.roll3));
      }
    }
    return byRoll;
  }

  byRoll.push(knockFromRack(standing, result.roll1));
  const r2 = result.roll2 ?? 0;
  if (result.roll1 + r2 === 10) {
    byRoll.push(knockFromRack(standing, r2));
    standing = new Set<number>(PIN_ORDER);
    if (result.roll3 !== undefined) {
      byRoll.push(knockFromRack(standing, result.roll3));
    }
  } else {
    byRoll.push(knockFromRack(standing, r2));
  }
  return byRoll;
}

export function cumulativeKnockedPins(byRoll: number[][]): number[] {
  return byRoll.flat();
}
