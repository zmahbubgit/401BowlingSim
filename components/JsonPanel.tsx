"use client";

import type { ReactNode } from "react";

function highlightJson(json: string): ReactNode {
  const lines = json.split("\n");
  return lines.map((line, i) => {
    const parts: ReactNode[] = [];
    let key = 0;
    const token =
      /("(?:\\.|[^"\\])*")\s*:|(-?\d+\.?\d*)|(true|false|null)|([{}\[\],:])/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = token.exec(line)) !== null) {
      if (m.index > last) {
        parts.push(
          <span key={key++} className="text-slate-300">
            {line.slice(last, m.index)}
          </span>
        );
      }
      if (m[1]) {
        parts.push(
          <span key={key++} className="text-sky-400">
            {m[1]}
          </span>
        );
        parts.push(<span key={key++} className="text-slate-500">:</span>);
      } else if (m[2]) {
        parts.push(
          <span key={key++} className="text-amber-300">
            {m[2]}
          </span>
        );
      } else if (m[3]) {
        parts.push(
          <span key={key++} className="text-purple-400">
            {m[3]}
          </span>
        );
      } else if (m[4]) {
        parts.push(
          <span key={key++} className="text-slate-500">
            {m[4]}
          </span>
        );
      }
      last = token.lastIndex;
    }
    if (last < line.length) {
      parts.push(
        <span key={key++} className="text-slate-300">
          {line.slice(last)}
        </span>
      );
    }
    return (
      <div key={i}>
        {parts}
        {i < lines.length - 1 ? "\n" : null}
      </div>
    );
  });
}

export interface JsonPanelProps {
  data: unknown;
  onCopy: () => void;
  copied: boolean;
}

export function JsonPanel({ data, onCopy, copied }: JsonPanelProps) {
  const text =
    data === null || data === undefined
      ? ""
      : typeof data === "string"
        ? data
        : JSON.stringify(data, null, 2);

  return (
    <div className="flex h-full min-h-[200px] flex-col rounded-xl border border-slate-700 bg-slate-950/80">
      <div className="flex items-center justify-between border-b border-slate-700 px-3 py-2">
        <span className="text-sm font-medium text-slate-300">Raw JSON</span>
        <button
          type="button"
          onClick={onCopy}
          className="rounded-md bg-slate-800 px-3 py-1 text-xs hover:bg-slate-700"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="flex-1 overflow-auto p-3 font-mono text-xs leading-relaxed">
        {text ? highlightJson(text) : <span className="text-slate-500">—</span>}
      </pre>
    </div>
  );
}
