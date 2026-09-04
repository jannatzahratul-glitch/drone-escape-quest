/**
 * LevelBuilder — assembles + VALIDATES a playable level.
 *
 * Generation is retried with new seeds until the level satisfies every rule
 * (solvable maze, reachable clues, reachable gates, non-obvious exit and a
 * clue set that uniquely identifies the real exit).
 */
import { generateMaze, type Maze } from "../maze/generator";
import { assignGateSymbols, buildClues, type Clue, type GateInfo } from "../clues/clueSystem";
import { getLevelConfig } from "./levels";

export interface LevelBuild {
  level: number;
  maze: Maze;
  gates: GateInfo[];
  clues: Clue[];
  /** optional secret spots worth XP — never required to finish */
  hidden: Array<{ x: number; y: number }>;
}

const cache = new Map<number, LevelBuild>();

export function buildLevel(level: number): LevelBuild {
  const cached = cache.get(level);
  if (cached) return cached;

  const config = getLevelConfig(level);
  let build: LevelBuild | null = null;

  for (let attempt = 0; attempt < 12 && !build; attempt++) {
    const maze = generateMaze({ ...config.maze, seed: config.maze.seed + attempt * 101 });
    const gates = assignGateSymbols(maze, config.maze.seed + attempt);
    const clues = buildClues(maze, gates, config.difficulty.cluePlan, config.maze.seed + attempt);
    if (validate(maze, gates, clues)) {
      build = { level, maze, gates, clues, hidden: pickHidden(maze, clues) };
    }
  }

  if (!build) {
    // extremely unlikely — fall back to the base generation so play never stalls
    const maze = generateMaze(config.maze);
    const gates = assignGateSymbols(maze, config.maze.seed);
    build = {
      level,
      maze,
      gates,
      clues: buildClues(maze, gates, config.difficulty.cluePlan, config.maze.seed),
      hidden: [],
    };
  }

  cache.set(level, build);
  return build;
}

function validate(maze: Maze, gates: GateInfo[], clues: Clue[]) {
  const idx = (x: number, y: number) => y * maze.width + x;
  const reach = (x: number, y: number) => (maze.dist[idx(x, y)] ?? -1) >= 0;

  // 1. every gate reachable
  if (!gates.every((g) => reach(g.x, g.y))) return false;
  // 2. clues exist and are reachable
  if (clues.length === 0) return false;
  if (!clues.every((c) => reach(c.cell.x, c.cell.y))) return false;
  // 3. the real exit must not be a few steps from the start
  const real = gates.find((g) => g.isReal)!;
  const realD = maze.dist[idx(real.x, real.y)] ?? 0;
  const maxD = Math.max(...gates.map((g) => maze.dist[idx(g.x, g.y)] ?? 0), 1);
  if (realD < Math.min(8, maxD * 0.35)) return false;
  // 4. at least one clue should be findable before the real exit
  if (!clues.some((c) => (maze.dist[idx(c.cell.x, c.cell.y)] ?? 0) <= realD)) return false;
  return true;
}

function pickHidden(maze: Maze, clues: Clue[]) {
  const taken = new Set(clues.map((c) => `${c.cell.x},${c.cell.y}`));
  return maze.deadEnds
    .filter((d) => !taken.has(`${d.x},${d.y}`))
    .slice(-3)
    .map((d) => ({ x: d.x, y: d.y }));
}
