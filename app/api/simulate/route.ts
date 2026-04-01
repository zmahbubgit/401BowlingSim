import { NextRequest, NextResponse } from "next/server";
import { simulateFrame } from "@/lib/frameSimulator";
import { simulateGame, type GameResult } from "@/lib/gameSimulator";

function normalizeSeed(raw: number): number {
  if (Number.isNaN(raw)) return 42;
  return raw >>> 0;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode");
  const skillRaw = parseFloat(searchParams.get("skill") ?? "0.5");
  const seedRaw = parseInt(searchParams.get("seed") ?? "42", 10);
  const isLastFrameRaw = searchParams.get("isLastFrame");

  if (!["frame", "game", "viz"].includes(mode ?? "")) {
    return NextResponse.json(
      { error: "mode must be frame, game, or viz" },
      { status: 400 }
    );
  }
  const skill = Math.max(0, Math.min(1, skillRaw));
  const seed = normalizeSeed(seedRaw);

  const headers: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  };

  if (mode === "frame") {
    const isLastFrame = isLastFrameRaw === "1";
    const result = simulateFrame(skill, seed, isLastFrame);
    return NextResponse.json(result, { headers });
  }

  if (mode === "game") {
    const result = simulateGame(skill, seed);
    return NextResponse.json(result, { headers });
  }

  if (mode === "viz") {
    const game = simulateGame(skill, seed);
    const html = buildVizHTML(game);
    return new NextResponse(html, {
      headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.json({ error: "Unknown mode" }, { status: 400 });
}

function buildVizHTML(game: GameResult): string {
  const rows = game.frames
    .map((f) => {
      let rollStr: string;
      if (f.frame_number === 10) {
        const [a, b, c] = f.rolls;
        const parts: string[] = [];
        if (a === 10) parts.push("X");
        else parts.push(a === 0 ? "-" : String(a));
        if (b !== undefined) {
          if (a === 10) {
            parts.push(b === 10 ? "X" : b === 0 ? "-" : String(b));
          } else if (a + b === 10) parts.push("/");
          else parts.push(b === 0 ? "-" : String(b));
        }
        if (c !== undefined) {
          const prev = a === 10 ? b ?? 0 : b ?? 0;
          if (a === 10 && prev === 10) {
            parts.push(c === 10 ? "X" : c === 0 ? "-" : String(c));
          } else {
            parts.push(c === 10 ? "X" : c === 0 ? "-" : String(c));
          }
        }
        rollStr = parts.join(" ");
      } else if (f.is_strike) {
        rollStr = "X";
      } else {
        rollStr = f.rolls
          .map((r, i) => {
            if (i === 1 && f.is_spare) return "/";
            return r === 0 ? "-" : String(r);
          })
          .join(" ");
      }
      return `<tr><td>${f.frame_number}</td><td>${rollStr}</td><td>${f.frame_score}</td><td>${f.cumulative_score}</td></tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html><head><title>Bowling Scorecard</title>
<meta charset="utf-8"/>
<style>body{font-family:monospace;padding:2rem;background:#1a1a2e;color:#eee;}
table{border-collapse:collapse;width:100%;max-width:720px;}
th,td{border:1px solid #555;padding:8px 12px;text-align:center;}
th{background:#16213e;}h1{color:#e94560;}</style></head>
<body><h1>Bowling Scorecard</h1>
<p>Skill: ${game.skill} | Seed: ${game.seed} | <strong>Total: ${game.total_score}</strong></p>
<table><tr><th>Frame</th><th>Rolls</th><th>Frame Score</th><th>Cumulative</th></tr>${rows}</table>
</body></html>`;
}
