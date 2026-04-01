import type { FrameResult } from "./frameSimulator";
import type { GameResult } from "./gameSimulator";

export function isGameResult(x: unknown): x is GameResult {
  return (
    typeof x === "object" &&
    x !== null &&
    "total_score" in x &&
    "frames" in x &&
    "all_rolls" in x
  );
}

export function isFrameResult(x: unknown): x is FrameResult {
  return (
    typeof x === "object" &&
    x !== null &&
    "roll1" in x &&
    "is_last_frame" in x
  );
}
