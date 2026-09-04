/**
 * DifficultyManager
 *
 * Difficulty is expressed as DATA — a set of tunable parameters — never as
 * hard-coded behaviour inside gameplay code. Levels reference a difficulty
 * tier and may override any individual parameter.
 */

export type DifficultyTier = "easy" | "medium" | "hard" | "very-hard" | "special";

export type VisualComplexity = "low" | "medium" | "high";

/** How many clue stones a level places and how directly they speak. */
export interface CluePlan {
  count: number;
  style: "obvious" | "simple" | "combo" | "subtle";
}

/** Configurable consequences for entering a fake gate. Kept gentle for now. */
export interface PenaltyConfig {
  /** milliseconds added to the run clock */
  timeMs: number;
  /** score points removed */
  score: number;
  /** brief screen darkening after a wrong gate */
  darkness: boolean;
}

export interface DifficultyParams {
  /** maze cells across (forced odd by the generator) */
  width: number;
  /** maze cells down */
  height: number;
  /** 0 = keep every dead end, 1 = remove nearly all of them (loopy maze) */
  deadEndDensity: number;
  /** 0..1 — how much the carver prefers long winding corridors over branches */
  branching: number;
  /** how long the correct route should be, as a fraction of the longest route */
  routeLength: number;
  /** total gates on the border. Exactly ONE is ever the real exit. */
  gateCount: number;
  /** density of decorative props / torches */
  visualComplexity: VisualComplexity;
  /** optional soft time limit in seconds (not enforced yet) */
  timeLimitSec: number | null;
  /** whether clue props may be placed near the correct route */
  cluesEnabled: boolean;
  /** clue stones placed in the maze */
  cluePlan: CluePlan;
  /** free hints available in the level */
  hintLimit: number;
  /** 0..1 — how tightly the fog closes in (fog of war strength) */
  fogStrength: number;
  /** consequence of entering a fake gate */
  penalty: PenaltyConfig;
  /** seconds under which the run still earns 3 / 2 stars */
  starTimeSec: [number, number];
  /** 1..5 — shown in the UI */
  rating: number;
  tier: DifficultyTier;
}

/** Reusable tier presets. Levels start from one of these and override. */
export const DIFFICULTY_PRESETS: Record<DifficultyTier, DifficultyParams> = {
  easy: {
    width: 13,
    height: 13,
    deadEndDensity: 0.6,
    branching: 0.25,
    routeLength: 0.55,
    gateCount: 2,
    visualComplexity: "high",
    timeLimitSec: null,
    cluesEnabled: true,
    cluePlan: { count: 1, style: "simple" },
    hintLimit: 3,
    fogStrength: 0.15,
    penalty: { timeMs: 0, score: 0, darkness: false },
    starTimeSec: [60, 120],
    rating: 1,
    tier: "easy",
  },
  medium: {
    width: 17,
    height: 17,
    deadEndDensity: 0.85,
    branching: 0.42,
    routeLength: 0.75,
    gateCount: 3,
    visualComplexity: "high",
    timeLimitSec: null,
    cluesEnabled: true,
    cluePlan: { count: 2, style: "obvious" },
    hintLimit: 2,
    fogStrength: 0.3,
    penalty: { timeMs: 0, score: 25, darkness: false },
    starTimeSec: [100, 190],
    rating: 3,
    tier: "medium",
  },
  hard: {
    width: 21,
    height: 21,
    deadEndDensity: 1,
    branching: 0.55,
    routeLength: 0.9,
    gateCount: 4,
    visualComplexity: "medium",
    timeLimitSec: null,
    cluesEnabled: true,
    cluePlan: { count: 3, style: "combo" },
    hintLimit: 1,
    fogStrength: 0.45,
    penalty: { timeMs: 5000, score: 50, darkness: true },
    starTimeSec: [150, 260],
    rating: 4,
    tier: "hard",
  },
  "very-hard": {
    width: 27,
    height: 27,
    deadEndDensity: 1,
    branching: 0.62,
    routeLength: 1,
    gateCount: 5,
    visualComplexity: "medium",
    timeLimitSec: null,
    cluesEnabled: true,
    cluePlan: { count: 4, style: "subtle" },
    hintLimit: 1,
    fogStrength: 0.6,
    penalty: { timeMs: 10000, score: 75, darkness: true },
    starTimeSec: [210, 340],
    rating: 5,
    tier: "very-hard",
  },
  special: {
    width: 29,
    height: 29,
    deadEndDensity: 1,
    branching: 0.68,
    routeLength: 1,
    gateCount: 6,
    visualComplexity: "medium",
    timeLimitSec: null,
    cluesEnabled: true,
    cluePlan: { count: 5, style: "subtle" },
    hintLimit: 1,
    fogStrength: 0.6,
    penalty: { timeMs: 10000, score: 100, darkness: true },
    starTimeSec: [240, 400],
    rating: 5,
    tier: "special",
  },
};

export const TIER_LABEL: Record<DifficultyTier, string> = {
  easy: "EASY",
  medium: "MEDIUM",
  hard: "HARD",
  "very-hard": "VERY HARD",
  special: "SPECIAL",
};

export function makeDifficulty(
  tier: DifficultyTier,
  overrides: Partial<DifficultyParams> = {},
): DifficultyParams {
  return { ...DIFFICULTY_PRESETS[tier], ...overrides, tier };
}
