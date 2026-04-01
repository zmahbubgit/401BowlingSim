"use client";

import type { GameResult } from "@/lib/gameSimulator";
import type { BatchStats } from "@/lib/stats";
import type { RollPinStep } from "@/lib/gamePinReplay";
import { isFrameResult, isGameResult } from "@/lib/guards";
import type { SimMode } from "./GameControls";
import { PinDiagram } from "./PinDiagram";
import { ScoreCard } from "./ScoreCard";

export interface ResultsPanelProps {
  mode: SimMode;
  error: string | null;
  result: unknown;
  batchStats: BatchStats | null;
  games100: GameResult[] | null;
  tournamentBoard: {
    name: string;
    skill: number;
    seed: number;
    total_score: number;
  }[] | null;
  calibration: { skill: number; mean: number }[] | null;
  animateRolls: boolean;
  revealRolls: number;
  frameKnocked: number[];
  gameSteps: RollPinStep[] | null;
  standingForGameReplay: number[];
  gameKnockedForDiagram: number[];
  currentReplayStep: RollPinStep | null;
  onNextRoll: () => void;
  onResetReplay: () => void;
}

export function ResultsPanel({
  mode,
  error,
  result,
  batchStats,
  games100,
  tournamentBoard,
  calibration,
  animateRolls,
  revealRolls,
  frameKnocked,
  gameSteps,
  standingForGameReplay,
  gameKnockedForDiagram,
  currentReplayStep,
  onNextRoll,
  onResetReplay,
}: ResultsPanelProps) {
  return (
    <section className="min-w-0 space-y-4 lg:col-span-1">
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {batchStats && games100 && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-amber-300">
            100-game batch
          </h3>
          <p className="font-mono text-lg text-slate-100">
            μ = {batchStats.mean.toFixed(2)} ± {batchStats.std.toFixed(2)} · min{" "}
            {batchStats.min} · max {batchStats.max}
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Strike rate (frames 1–9):{" "}
            <span className="text-amber-200">
              {(batchStats.strikeRate * 100).toFixed(1)}%
            </span>
            {" · "}
            Spare rate:{" "}
            <span className="text-sky-200">
              {(batchStats.spareRate * 100).toFixed(1)}%
            </span>
          </p>
          <div className="mt-4 flex h-24 items-end gap-1">
            {batchStats.distribution.map((d) => {
              const maxC = Math.max(
                ...batchStats.distribution.map((x) => x.count),
                1
              );
              const h = (d.count / maxC) * 100;
              return (
                <div
                  key={d.binStart}
                  className="flex flex-1 flex-col items-center justify-end"
                  title={`${d.binStart}-${d.binEnd}: ${d.count}`}
                >
                  <div
                    className="w-full min-w-[6px] rounded-t bg-amber-600/80"
                    style={{ height: `${h}%` }}
                  />
                  <span className="mt-1 text-[9px] text-slate-500">
                    {d.binStart}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tournamentBoard && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-amber-300">
            Tournament leaderboard
          </h3>
          <ol className="space-y-2">
            {tournamentBoard.map((r, i) => (
              <li
                key={r.name + r.seed}
                className="flex justify-between rounded-lg bg-slate-950/60 px-3 py-2 font-mono text-sm"
              >
                <span>
                  {i + 1}. {r.name}{" "}
                  <span className="text-slate-500">
                    (s={r.skill.toFixed(2)}, #{r.seed})
                  </span>
                </span>
                <span className="text-emerald-400">{r.total_score}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {calibration && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
          <h3 className="mb-2 text-sm font-semibold text-amber-300">
            Skill calibration (mean total score)
          </h3>
          <div className="flex h-32 items-end gap-0.5">
            {calibration.map((c) => {
              const maxM = Math.max(...calibration.map((x) => x.mean), 1);
              const h = (c.mean / maxM) * 100;
              return (
                <div
                  key={c.skill}
                  className="flex flex-1 flex-col items-center"
                  title={`skill ${c.skill}: ${c.mean.toFixed(1)}`}
                >
                  <div
                    className="w-full rounded-t bg-sky-600/80"
                    style={{ height: `${h}%` }}
                  />
                  <span className="text-[9px] text-slate-500">
                    {c.skill.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mode === "frame" && isFrameResult(result) && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <h3 className="mb-2 text-sm font-medium text-slate-300">
              Frame result
            </h3>
            <pre className="overflow-x-auto font-mono text-xs text-slate-200">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <h3 className="mb-3 text-sm font-medium text-slate-300">
              Pins after frame
            </h3>
            <PinDiagram knockedPins={frameKnocked} />
          </div>
        </div>
      )}

      {mode === "game" && isGameResult(result) && (
        <>
          <ScoreCard
            frames={result.frames}
            revealedRollCount={animateRolls ? revealRolls : undefined}
          />
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-slate-300">
                Pin replay · standing: {standingForGameReplay.length}
              </h3>
              {!animateRolls && gameSteps && gameSteps.length > 0 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onNextRoll}
                    className="rounded-md bg-slate-800 px-3 py-1 text-xs hover:bg-slate-700"
                  >
                    Next roll
                  </button>
                  <button
                    type="button"
                    onClick={onResetReplay}
                    className="rounded-md border border-slate-600 px-3 py-1 text-xs hover:bg-slate-800"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
            <PinDiagram knockedPins={gameKnockedForDiagram} />
            {currentReplayStep && (
              <p className="mt-3 font-mono text-xs text-slate-400">
                F{currentReplayStep.frame} ball {currentReplayStep.rollInFrame} ·
                down {currentReplayStep.pinsDownThisRoll} · pins{" "}
                {currentReplayStep.knockedThisRoll.join(", ") || "—"}
              </p>
            )}
          </div>
        </>
      )}

      {mode === "viz" &&
        result &&
        typeof result === "object" &&
        "info" in result && (
          <p className="text-sm text-slate-400">
            {(result as { info: string }).info}
          </p>
        )}

      {!result && !error && (
        <p className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-slate-500">
          Set skill and seed, then Simulate. Use Run 100 games for batch stats.
        </p>
      )}
    </section>
  );
}
