/**
 * DifficultyManager
 *
 * Difficulty is expressed as DATA — a set of tunable parameters — never as
 * hard-coded behaviour inside gameplay code. Levels reference a difficulty
 * tier and may override any individual parameter.
 */

export type DifficultyTier = "easy" | "medium" | "hard" | "very-hard" | "special";

export type VisualComplexity = "low" | "medium" | "high";

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
  /** 1..5 — shown in the UI */
  rating: number;
  tier: DifficultyTier;
}

/** Reusable tier presets. Levels start from one of these and override. */
export const DIFFICULTY_PRESETS: Record<DifficultyTier, DifficultyParams> = {
  easy: {
    width: 13,
    height: 13,
    deadEndDensity: 0.45,
    branching: 0.35,
    routeLength: 0.55,
    gateCount: 2,
    visualComplexity: "high",
    timeLimitSec: null,
    cluesEnabled: true,
    rating: 1,
    tier: "easy",
  },
  medium: {
    width: 17,
    height: 17,
    deadEndDensity: 0.7,
    branching: 0.55,
    routeLength: 0.75,
    gateCount: 3,
    visualComplexity: "high",
    timeLimitSec: null,
    cluesEnabled: true,
    rating: 3,
    tier: "medium",
  },
  hard: {
    width: 21,
    height: 21,
    deadEndDensity: 0.88,
    branching: 0.75,
    routeLength: 0.9,
    gateCount: 4,
    visualComplexity: "medium",
    timeLimitSec: null,
    cluesEnabled: false,
    rating: 4,
    tier: "hard",
  },
  "very-hard": {
    width: 27,
    height: 27,
    deadEndDensity: 0.95,
    branching: 0.85,
    routeLength: 1,
    gateCount: 5,
    visualComplexity: "medium",
    timeLimitSec: null,
    cluesEnabled: false,
    rating: 5,
    tier: "very-hard",
  },
  special: {
    width: 29,
    height: 29,
    deadEndDensity: 0.92,
    branching: 0.9,
    routeLength: 1,
    gateCount: 6,
    visualComplexity: "medium",
    timeLimitSec: null,
    cluesEnabled: false,
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
