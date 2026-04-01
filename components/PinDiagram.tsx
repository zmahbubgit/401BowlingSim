"use client";

const ROWS: number[][] = [
  [7, 8, 9, 10],
  [4, 5, 6],
  [2, 3],
  [1],
];

export interface PinDiagramProps {
  /** Pin numbers (1–10) that are down after the current view */
  knockedPins: number[];
  className?: string;
}

export function PinDiagram({ knockedPins, className = "" }: PinDiagramProps) {
  const down = new Set(knockedPins);

  return (
    <div
      className={`flex flex-col items-center gap-1.5 ${className}`}
      aria-label="Pin diagram"
    >
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-2">
          {row.map((pin) => {
            const isUp = !down.has(pin);
            return (
              <div
                key={pin}
                title={`Pin ${pin}`}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isUp
                    ? "bg-white text-slate-900 shadow-md ring-2 ring-amber-500/40"
                    : "bg-slate-600 text-slate-400 ring-1 ring-slate-700"
                }`}
              >
                {pin}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
