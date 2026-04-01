"use client";

export type SimMode = "frame" | "game" | "viz";

export interface GameControlsProps {
  mode: SimMode;
  onModeChange: (m: SimMode) => void;
  skill: number;
  onSkillChange: (n: number) => void;
  seed: number;
  onSeedChange: (n: number) => void;
  isLastFrame: boolean;
  onIsLastFrameChange: (v: boolean) => void;
  onSimulate: () => void;
  onRun100: () => void;
  onTournament: () => void;
  onCalibrate: () => void;
  onExportCsv: () => void;
  tournamentN: number;
  onTournamentNChange: (n: number) => void;
  animateRolls: boolean;
  onAnimateRollsChange: (v: boolean) => void;
  isLoading: boolean;
}

export function GameControls({
  mode,
  onModeChange,
  skill,
  onSkillChange,
  seed,
  onSeedChange,
  isLastFrame,
  onIsLastFrameChange,
  onSimulate,
  onRun100,
  onTournament,
  onCalibrate,
  onExportCsv,
  tournamentN,
  onTournamentNChange,
  animateRolls,
  onAnimateRollsChange,
  isLoading,
}: GameControlsProps) {
  return (
    <div className="space-y-5 rounded-xl border border-slate-700 bg-slate-900/60 p-4 shadow-lg">
      <h2 className="text-lg font-semibold text-amber-400">Control Panel</h2>

      <fieldset className="space-y-2">
        <legend className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Mode
        </legend>
        <div className="flex flex-wrap gap-3">
          {(
            [
              ["frame", "Frame"],
              ["game", "Game"],
              ["viz", "Viz (HTML)"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 text-sm text-slate-200"
            >
              <input
                type="radio"
                name="mode"
                checked={mode === value}
                onChange={() => onModeChange(value)}
                className="accent-amber-500"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="mb-1 flex justify-between text-sm">
          <label htmlFor="skill" className="text-slate-300">
            Skill
          </label>
          <span className="font-mono text-amber-300">{skill.toFixed(2)}</span>
        </div>
        <input
          id="skill"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={skill}
          onChange={(e) => onSkillChange(Number(e.target.value))}
          className="w-full accent-amber-500"
        />
      </div>

      <div>
        <label htmlFor="seed" className="text-sm text-slate-300">
          Seed
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id="seed"
            type="number"
            value={Number.isFinite(seed) ? seed : 0}
            onChange={(e) => onSeedChange(parseInt(e.target.value, 10) || 0)}
            className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100"
          />
          <button
            type="button"
            onClick={() => onSeedChange((Math.floor(Math.random() * 1e9) >>> 0) % 2147483647)}
            className="shrink-0 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700"
          >
            Random seed
          </button>
        </div>
      </div>

      {mode === "frame" && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={isLastFrame}
            onChange={(e) => onIsLastFrameChange(e.target.checked)}
            className="accent-amber-500"
          />
          10th frame (isLastFrame)
        </label>
      )}

      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-200">
        <input
          type="checkbox"
          checked={animateRolls}
          onChange={(e) => onAnimateRollsChange(e.target.checked)}
          className="accent-amber-500"
        />
        Animated roll-by-roll reveal
      </label>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onSimulate}
          disabled={isLoading}
          className="rounded-lg bg-amber-600 px-4 py-2.5 font-semibold text-slate-950 hover:bg-amber-500 disabled:opacity-50"
        >
          Simulate
        </button>
        <button
          type="button"
          onClick={onRun100}
          disabled={isLoading}
          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700 disabled:opacity-50"
        >
          Run 100 games
        </button>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="text-xs text-slate-400">Tournament size (N)</label>
            <input
              type="number"
              min={2}
              max={32}
              value={tournamentN}
              onChange={(e) =>
                onTournamentNChange(Math.max(2, Math.min(32, parseInt(e.target.value, 10) || 2)))
              }
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 font-mono text-sm"
            />
          </div>
          <button
            type="button"
            onClick={onTournament}
            disabled={isLoading}
            className="rounded-lg border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-200 hover:bg-amber-900/40 disabled:opacity-50"
          >
            Tournament
          </button>
        </div>
        <button
          type="button"
          onClick={onCalibrate}
          disabled={isLoading}
          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700 disabled:opacity-50"
        >
          Skill calibration (0–1 step 0.1)
        </button>
        <button
          type="button"
          onClick={onExportCsv}
          disabled={isLoading}
          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700 disabled:opacity-50"
        >
          Export CSV (last batch / game)
        </button>
      </div>
    </div>
  );
}
