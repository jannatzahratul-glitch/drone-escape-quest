import { makeDifficulty, TIER_LABEL, type DifficultyParams, type DifficultyTier } from "../difficulty/difficulty";
import type { MazeConfig } from "../maze/generator";

/**
 * LevelManager
 *
 * Levels are DATA: a difficulty tier plus optional parameter overrides.
 * Difficulty deliberately follows a RHYTHM rather than a straight ramp so the
 * game stays unpredictable:
 *   1 hard-ish · 2 easy · 3 medium · 4 hard · 5 medium
 *   6 easy · 7 hard · 8 medium · 9 very hard · 10 special challenge
 */
export interface LevelConfig {
  id: number;
  name: string;
  subtitle: string;
  difficulty: DifficultyParams;
  maze: MazeConfig;
}

interface LevelSpec {
  tier: DifficultyTier;
  subtitle: string;
  overrides?: Partial<DifficultyParams>;
}

const SPECS: LevelSpec[] = [
  // 1 — hard-ish opener: medium maze, plenty of dead ends, only 2 gates.
  {
    tier: "medium",
    subtitle: "THE FIRST DOUBT",
    overrides: {
      width: 17,
      height: 17,
      gateCount: 2,
      deadEndDensity: 0.85,
      branching: 0.5,
      routeLength: 0.95,
      rating: 3,
    },
  },
  // 2 — easy recovery.
  {
    tier: "easy",
    subtitle: "BREATHING ROOM",
    overrides: { width: 11, height: 11, gateCount: 2, deadEndDensity: 0.35, routeLength: 0.5, rating: 1 },
  },
  // 3 — medium, 3 gates, more branching.
  {
    tier: "medium",
    subtitle: "THREE PROMISES",
    overrides: { width: 19, height: 19, gateCount: 3, deadEndDensity: 0.75, branching: 0.45, rating: 3 },
  },
  // 4 — hard, misleading routes.
  {
    tier: "hard",
    subtitle: "FALSE CORRIDORS",
    overrides: { width: 23, height: 21, gateCount: 4, deadEndDensity: 0.9, branching: 0.58, rating: 4 },
  },
  // 5 — medium recovery, more gates but a short route.
  {
    tier: "medium",
    subtitle: "SHORT MERCY",
    overrides: { width: 17, height: 17, gateCount: 4, deadEndDensity: 0.6, routeLength: 0.6, rating: 2 },
  },
  // 6 — easy, compact, 3 gates.
  {
    tier: "easy",
    subtitle: "QUIET STONES",
    overrides: { width: 13, height: 13, gateCount: 3, deadEndDensity: 0.4, routeLength: 0.55, rating: 1 },
  },
  // 7 — hard, long maze, many dead ends.
  {
    tier: "hard",
    subtitle: "THE LONG DARK",
    overrides: { width: 25, height: 23, gateCount: 4, deadEndDensity: 0.95, branching: 0.6, rating: 4 },
  },
  // 8 — medium, moderate maze, 4 gates.
  {
    tier: "medium",
    subtitle: "FOUR WHISPERS",
    overrides: { width: 19, height: 19, gateCount: 4, deadEndDensity: 0.7, rating: 3 },
  },
  // 9 — very hard.
  {
    tier: "very-hard",
    subtitle: "THE LABYRINTH",
    overrides: { width: 29, height: 27, gateCount: 5, deadEndDensity: 0.97, rating: 5 },
  },
  // 10 — special challenge.
  {
    tier: "special",
    subtitle: "THE ONE WAY OUT",
    overrides: { width: 31, height: 29, gateCount: 6, deadEndDensity: 0.94, branching: 0.66, rating: 5 },
  },
];

/** Rhythm applied when generating levels beyond the authored table. */
const RHYTHM: DifficultyTier[] = ["hard", "easy", "medium", "hard", "medium", "very-hard"];

export const TOTAL_LEVELS = SPECS.length;

export function getLevelConfig(id: number): LevelConfig {
  const spec =
    SPECS[id - 1] ??
    ({
      tier: RHYTHM[(id - TOTAL_LEVELS - 1) % RHYTHM.length] ?? "medium",
      subtitle: "DEEPER STILL",
    } satisfies LevelSpec);

  const difficulty = makeDifficulty(spec.tier, spec.overrides);

  return {
    id,
    name: `LEVEL ${String(id).padStart(2, "0")}`,
    subtitle: spec.subtitle,
    difficulty,
    maze: {
      width: difficulty.width,
      height: difficulty.height,
      deadEndDensity: difficulty.deadEndDensity,
      branching: difficulty.branching,
      routeLength: difficulty.routeLength,
      gateCount: difficulty.gateCount,
      seed: id * 7919 + 13,
    },
  };
}

export function getLevelLabel(id: number) {
  return TIER_LABEL[getLevelConfig(id).difficulty.tier];
}
