"use client";

import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { simulateGame, type GameResult } from "@/lib/gameSimulator";
import { buildGamePinSteps } from "@/lib/gamePinReplay";
import { isFrameResult, isGameResult } from "@/lib/guards";
import {
  PIN_ORDER,
  cumulativeKnockedPins,
  frameResultToKnockedByRoll,
} from "@/lib/pinLayout";
import { summarizeGames, type BatchStats } from "@/lib/stats";
import { GameControls, type SimMode } from "./GameControls";
import { JsonPanel } from "./JsonPanel";
import { ResultsPanel } from "./ResultsPanel";

function normalizeSeedInput(n: number): number {
  if (!Number.isFinite(n)) return 42;
  return n >>> 0;
}

function buildApiQuery(
  mode: SimMode,
  skill: number,
  seed: number,
  isLastFrame: boolean
): string {
  const p = new URLSearchParams();
  p.set("mode", mode);
  p.set("skill", String(skill));
  p.set("seed", String(seed));
  if (mode === "frame") p.set("isLastFrame", isLastFrame ? "1" : "0");
  return p.toString();
}

function buildPageQuery(
  mode: SimMode,
  skill: number,
  seed: number,
  isLastFrame: boolean
): string {
  return `?${buildApiQuery(mode, skill, seed, isLastFrame)}`;
}

export default function HomeClient() {
  const searchParams = useSearchParams();
  const hydrated = useRef(false);
  const autoSimulated = useRef(false);

  const [mode, setMode] = useState<SimMode>("game");
  const [skill, setSkill] = useState(0.5);
  const [seed, setSeed] = useState(42);
  const [isLastFrame, setIsLastFrame] = useState(false);
  const [animateRolls, setAnimateRolls] = useState(false);
  const [tournamentN, setTournamentN] = useState(4);

  const [result, setResult] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [batchStats, setBatchStats] = useState<BatchStats | null>(null);
  const [games100, setGames100] = useState<GameResult[] | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const [tournamentPlayers, setTournamentPlayers] = useState<
    { name: string; skill: number; seed: number }[]
  >(
    Array.from({ length: 4 }, (_, i) => ({
      name: `Player ${i + 1}`,
      skill: 0.35 + i * 0.15,
      seed: ((i + 1) * 97) >>> 0,
    }))
  );
  const [tournamentBoard, setTournamentBoard] = useState<
    { name: string; skill: number; seed: number; total_score: number }[] | null
  >(null);

  const [calibration, setCalibration] = useState<
    { skill: number; mean: number }[] | null
  >(null);

  const [revealRolls, setRevealRolls] = useState(0);
  const [manualStep, setManualStep] = useState(0);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const m = searchParams.get("mode") as SimMode | null;
    if (m === "frame" || m === "game" || m === "viz") setMode(m);
    const sk = parseFloat(searchParams.get("skill") ?? "");
    if (!Number.isNaN(sk)) setSkill(Math.max(0, Math.min(1, sk)));
    const sd = parseInt(searchParams.get("seed") ?? "", 10);
    if (!Number.isNaN(sd)) setSeed(sd);
    const ilf = searchParams.get("isLastFrame");
    if (ilf === "1") setIsLastFrame(true);
    if (ilf === "0") setIsLastFrame(false);
  }, [searchParams]);

  const syncUrl = useCallback(() => {
    const q = buildPageQuery(mode, skill, seed, isLastFrame);
    window.history.replaceState({}, "", q);
  }, [mode, skill, seed, isLastFrame]);

  const simulate = useCallback(async () => {
    setError(null);
    setBatchStats(null);
    setGames100(null);
    setTournamentBoard(null);
    setCalibration(null);
    const ns = normalizeSeedInput(seed);

    if (mode === "viz") {
      const qs = buildApiQuery(mode, skill, ns, isLastFrame);
      window.open(`${window.location.origin}/api/simulate?${qs}`, "_blank");
      setResult({ info: "Opened Viz HTML in a new tab.", query: qs });
      syncUrl();
      return;
    }

    setIsLoading(true);
    try {
      const qs = buildApiQuery(mode, skill, ns, isLastFrame);
      const res = await fetch(`/api/simulate?${qs}`);
      const data = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? res.statusText);
        setResult(null);
        return;
      }
      setResult(data);
      syncUrl();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [mode, skill, seed, isLastFrame, syncUrl]);

  const run100 = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setTournamentBoard(null);
    setCalibration(null);
    const ns = normalizeSeedInput(seed);
    try {
      const games: GameResult[] = [];
      for (let i = 0; i < 100; i++) {
        games.push(simulateGame(skill, (ns + i) >>> 0));
      }
      setGames100(games);
      setBatchStats(summarizeGames(games));
      setResult(games[99]);
      syncUrl();
    } finally {
      setIsLoading(false);
    }
  }, [skill, seed, syncUrl]);

  const runTournament = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setBatchStats(null);
    setGames100(null);
    setCalibration(null);
    try {
      const players = tournamentPlayers.slice(0, tournamentN);
      const rows = players.map((p) => {
        const g = simulateGame(
          Math.max(0, Math.min(1, p.skill)),
          normalizeSeedInput(p.seed)
        );
        return {
          name: p.name,
          skill: p.skill,
          seed: normalizeSeedInput(p.seed),
          total_score: g.total_score,
        };
      });
      rows.sort((a, b) => b.total_score - a.total_score);
      setTournamentBoard(rows);
      setResult({ tournament: rows });
    } finally {
      setIsLoading(false);
    }
  }, [tournamentPlayers, tournamentN]);

  const runCalibration = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setBatchStats(null);
    setGames100(null);
    setTournamentBoard(null);
    const ns = normalizeSeedInput(seed);
    try {
      const out: { skill: number; mean: number }[] = [];
      for (let s = 0; s <= 10; s++) {
        const sk = s / 10;
        let sum = 0;
        const reps = 25;
        for (let i = 0; i < reps; i++) {
          sum += simulateGame(sk, (ns + i + s * 1000) >>> 0).total_score;
        }
        out.push({ skill: sk, mean: sum / reps });
      }
      setCalibration(out);
      setResult({ calibration: out });
    } finally {
      setIsLoading(false);
    }
  }, [seed]);

  const exportCsv = useCallback(() => {
    let csv = "type,seed,skill,total_score\n";
    if (games100?.length) {
      games100.forEach((g, i) => {
        csv += `batch,${(normalizeSeedInput(seed) + i) >>> 0},${g.skill},${g.total_score}\n`;
      });
    } else if (tournamentBoard?.length) {
      tournamentBoard.forEach((r) => {
        csv += `tournament,${r.seed},${r.skill},${r.total_score}\n`;
      });
    } else if (calibration?.length) {
      csv = "type,skill,mean_total_score\n";
      calibration.forEach((c) => {
        csv += `calibration,${c.skill},${c.mean}\n`;
      });
    } else if (isGameResult(result)) {
      csv += `game,${result.seed},${result.skill},${result.total_score}\n`;
    } else {
      return;
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "bowling-sim-export.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }, [games100, tournamentBoard, calibration, result, seed]);

  const copyShare = useCallback(() => {
    const url = `${window.location.origin}${buildPageQuery(mode, skill, normalizeSeedInput(seed), isLastFrame)}`;
    void navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }, [mode, skill, seed, isLastFrame]);

  const copyJson = useCallback(() => {
    const t =
      result === null || result === undefined
        ? ""
        : JSON.stringify(result, null, 2);
    void navigator.clipboard.writeText(t);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  }, [result]);

  const gameSteps = useMemo(() => {
    if (!isGameResult(result)) return null;
    return buildGamePinSteps(result.all_rolls);
  }, [result]);

  const maxRolls = gameSteps?.length ?? 0;

  useEffect(() => {
    if (!isGameResult(result) || !animateRolls || mode !== "game") {
      setRevealRolls(maxRolls);
      return;
    }
    setRevealRolls(0);
    let step = 0;
    const id = window.setInterval(() => {
      step += 1;
      setRevealRolls(step);
      if (step >= maxRolls) window.clearInterval(id);
    }, 450);
    return () => window.clearInterval(id);
  }, [result, animateRolls, mode, maxRolls]);

  useEffect(() => {
    setManualStep(0);
  }, [result]);

  const frameKnocked = useMemo(() => {
    if (!isFrameResult(result)) return [];
    return cumulativeKnockedPins(frameResultToKnockedByRoll(result));
  }, [result]);

  const replayStepIndex = animateRolls ? revealRolls - 1 : manualStep;

  const gameKnockedForDiagram = useMemo(() => {
    if (!gameSteps?.length) return [];
    if (replayStepIndex < 0) return [];
    const idx = Math.min(replayStepIndex, gameSteps.length - 1);
    const standing = gameSteps[idx]?.standing ?? [];
    return PIN_ORDER.filter((p) => !standing.includes(p));
  }, [gameSteps, replayStepIndex]);

  const standingForGameReplay = useMemo(() => {
    if (!gameSteps?.length) return [...PIN_ORDER];
    if (replayStepIndex < 0) return [...PIN_ORDER];
    const idx = Math.min(replayStepIndex, gameSteps.length - 1);
    return gameSteps[idx]?.standing ?? [...PIN_ORDER];
  }, [gameSteps, replayStepIndex]);

  const jsonForPanel = useMemo(() => {
    if (error) return { error };
    return result;
  }, [result, error]);

  const currentReplayStep = useMemo(() => {
    if (!gameSteps?.length || replayStepIndex < 0) return null;
    return gameSteps[Math.min(replayStepIndex, gameSteps.length - 1)] ?? null;
  }, [gameSteps, replayStepIndex]);

  useEffect(() => {
    setTournamentPlayers((prev) => {
      if (prev.length > tournamentN) return prev.slice(0, tournamentN);
      if (prev.length >= tournamentN) return prev;
      const out = [...prev];
      let i = out.length;
      while (out.length < tournamentN) {
        out.push({
          name: `Player ${i + 1}`,
          skill: 0.5,
          seed: (((i + 3) * 7919) >>> 0) % 2147483647,
        });
        i++;
      }
      return out;
    });
  }, [tournamentN]);

  useEffect(() => {
    if (autoSimulated.current) return;
    const m = searchParams.get("mode") as SimMode | null;
    if (m !== "frame" && m !== "game" && m !== "viz") return;
    if (m === "viz") return;
    autoSimulated.current = true;
    const sk = Math.max(
      0,
      Math.min(1, parseFloat(searchParams.get("skill") ?? "0.5"))
    );
    const sdRaw = parseInt(searchParams.get("seed") ?? "42", 10);
    const sd = normalizeSeedInput(Number.isNaN(sdRaw) ? 42 : sdRaw);
    const ilf = searchParams.get("isLastFrame") === "1";

    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const qs = buildApiQuery(m, sk, sd, ilf);
        const res = await fetch(`/api/simulate?${qs}`);
        const data = await res.json();
        if (!res.ok) {
          setError((data as { error?: string }).error ?? res.statusText);
          return;
        }
        setResult(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-amber-400">
              Bowling Simulation Engine
            </h1>
            <p className="text-sm text-slate-400">
              Deterministic Mulberry32 · Official scoring · Sports analytics lab
            </p>
          </div>
          <button
            type="button"
            onClick={copyShare}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800"
          >
            {copiedLink ? "Link copied" : "Share URL"}
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-6 p-4 lg:grid-cols-[280px_1fr_340px]">
        <aside className="space-y-4 lg:col-span-1">
          <GameControls
            mode={mode}
            onModeChange={setMode}
            skill={skill}
            onSkillChange={(n) => setSkill(n)}
            seed={seed}
            onSeedChange={setSeed}
            isLastFrame={isLastFrame}
            onIsLastFrameChange={setIsLastFrame}
            onSimulate={simulate}
            onRun100={run100}
            onTournament={runTournament}
            onCalibrate={runCalibration}
            onExportCsv={exportCsv}
            tournamentN={tournamentN}
            onTournamentNChange={setTournamentN}
            animateRolls={animateRolls}
            onAnimateRollsChange={setAnimateRolls}
            isLoading={isLoading}
          />

          {tournamentBoard === null && (
            <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
              <h3 className="mb-2 text-sm font-medium text-slate-300">
                Tournament players
              </h3>
              <div className="max-h-48 space-y-2 overflow-y-auto text-xs">
                {tournamentPlayers.slice(0, tournamentN).map((p, i) => (
                  <div key={i} className="grid grid-cols-1 gap-1 border-b border-slate-800 pb-2">
                    <input
                      value={p.name}
                      onChange={(e) => {
                        const next = [...tournamentPlayers];
                        next[i] = { ...next[i], name: e.target.value };
                        setTournamentPlayers(next);
                      }}
                      className="rounded border border-slate-600 bg-slate-950 px-2 py-1"
                    />
                    <div className="flex gap-1">
                      <input
                        type="number"
                        min={0}
                        max={1}
                        step={0.01}
                        value={p.skill}
                        onChange={(e) => {
                          const next = [...tournamentPlayers];
                          next[i] = {
                            ...next[i],
                            skill: Math.max(
                              0,
                              Math.min(1, parseFloat(e.target.value) || 0)
                            ),
                          };
                          setTournamentPlayers(next);
                        }}
                        className="w-full rounded border border-slate-600 bg-slate-950 px-1 py-0.5 font-mono"
                      />
                      <input
                        type="number"
                        value={p.seed}
                        onChange={(e) => {
                          const next = [...tournamentPlayers];
                          next[i] = {
                            ...next[i],
                            seed: parseInt(e.target.value, 10) || 0,
                          };
                          setTournamentPlayers(next);
                        }}
                        className="w-full rounded border border-slate-600 bg-slate-950 px-1 py-0.5 font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        <ResultsPanel
          mode={mode}
          error={error}
          result={result}
          batchStats={batchStats}
          games100={games100}
          tournamentBoard={tournamentBoard}
          calibration={calibration}
          animateRolls={animateRolls}
          revealRolls={revealRolls}
          frameKnocked={frameKnocked}
          gameSteps={gameSteps}
          standingForGameReplay={standingForGameReplay}
          gameKnockedForDiagram={gameKnockedForDiagram}
          currentReplayStep={currentReplayStep}
          onNextRoll={() =>
            setManualStep((s) =>
              Math.min(s + 1, Math.max(0, (gameSteps?.length ?? 1) - 1))
            )
          }
          onResetReplay={() => setManualStep(-1)}
        />

        <aside className="min-h-[280px] lg:col-span-1">
          <JsonPanel data={jsonForPanel} onCopy={copyJson} copied={copiedJson} />
          <p className="mt-2 text-center text-xs text-slate-600">
            API:{" "}
            <code className="text-slate-500">
              /api/simulate?mode=game&amp;skill=0.75&amp;seed=42
            </code>
          </p>
        </aside>
      </main>
    </div>
  );
}
