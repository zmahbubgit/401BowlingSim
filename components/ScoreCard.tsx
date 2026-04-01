"use client";

import type { Frame } from "@/lib/scoring";

function rollsInFrame(f: Frame): number {
  if (f.frame_number === 10) return f.rolls.length;
  return f.is_strike ? 1 : 2;
}

function formatRolls(f: Frame, revealedRolls: number): string[] {
  const isLast = f.frame_number === 10;
  const rolls = f.rolls;

  if (!isLast) {
    if (f.is_strike) {
      if (revealedRolls >= 1) return ["X", ""];
      return ["", ""];
    }
    const r0 = rolls[0] ?? 0;
    const r1 = rolls[1] ?? 0;
    const cells: string[] = ["", ""];
    if (revealedRolls >= 1) cells[0] = r0 === 0 ? "-" : String(r0);
    if (revealedRolls >= 2) {
      cells[1] = f.is_spare ? "/" : r1 === 0 ? "-" : String(r1);
    }
    return cells;
  }

  const [a, b, c] = rolls;
  const cells = ["", "", ""];
  let need = revealedRolls;

  if (need >= 1) {
    cells[0] = a === 10 ? "X" : a === 0 ? "-" : String(a);
    need--;
  }
  if (need >= 1 && b !== undefined) {
    if (a === 10) {
      cells[1] = b === 10 ? "X" : b === 0 ? "-" : String(b);
    } else if (a + b === 10) {
      cells[1] = "/";
    } else {
      cells[1] = b === 0 ? "-" : String(b);
    }
    need--;
  }
  if (need >= 1 && c !== undefined) {
    if (a === 10 && b === 10) {
      cells[2] = c === 10 ? "X" : c === 0 ? "-" : String(c);
    } else if (a === 10) {
      cells[2] = c === 10 ? "X" : c === 0 ? "-" : String(c);
    } else {
      cells[2] = c === 10 ? "X" : c === 0 ? "-" : String(c);
    }
  }
  return cells;
}

function frameBorderClass(f: Frame): string {
  if (f.is_strike) return "border-amber-400/80 ring-1 ring-amber-500/30";
  if (f.is_spare) return "border-sky-500/80 ring-1 ring-sky-500/25";
  return "border-slate-600";
}

export interface ScoreCardProps {
  frames: Frame[];
  /** Number of rolls revealed from the start of the game (undefined = all) */
  revealedRollCount?: number;
  className?: string;
}

export function ScoreCard({
  frames,
  revealedRollCount,
  className = "",
}: ScoreCardProps) {
  let remaining =
    revealedRollCount === undefined ? Number.POSITIVE_INFINITY : revealedRollCount;
  const perFrameRevealed = frames.map((f) => {
    const need = rollsInFrame(f);
    const cap =
      remaining === Number.POSITIVE_INFINITY
        ? need
        : Math.max(0, Math.min(need, remaining));
    if (remaining !== Number.POSITIVE_INFINITY) remaining -= cap;
    return cap;
  });

  return (
    <div
      className={`overflow-x-auto rounded-xl border border-slate-700 bg-slate-950/50 p-3 ${className}`}
    >
      <div className="flex min-w-[640px] gap-0.5">
        {frames.map((f, i) => {
          const small = f.frame_number === 10 ? 3 : 2;
          const rollCells = formatRolls(f, perFrameRevealed[i]);

          return (
            <div
              key={f.frame_number}
              className={`flex min-w-[56px] flex-1 flex-col border-2 bg-slate-900/80 ${frameBorderClass(f)}`}
            >
              <div className="flex h-10 border-b border-slate-700">
                {Array.from({ length: small }).map((_, j) => (
                  <div
                    key={j}
                    className={`flex flex-1 items-center justify-center border-l border-slate-700 text-sm font-semibold first:border-l-0 ${
                      rollCells[j] === "X"
                        ? "text-amber-300"
                        : rollCells[j] === "/"
                          ? "text-sky-300"
                          : "text-slate-100"
                    }`}
                  >
                    {rollCells[j]}
                  </div>
                ))}
              </div>
              <div className="flex h-11 items-center justify-center border-t border-slate-800 text-sm">
                <div className="text-center leading-tight">
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">
                    Frame
                  </div>
                  <div className="font-mono text-xs text-slate-400">
                    {f.frame_score}
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-800 py-1 text-center font-mono text-sm font-bold text-emerald-400">
                {f.cumulative_score}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs text-slate-500">
        Top: rolls · Middle: frame score · Bottom: cumulative
      </p>
    </div>
  );
}
