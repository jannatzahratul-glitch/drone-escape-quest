/**
 * ScoreManager — configurable score + star rating.
 * Every weight lives in SCORING so balancing never touches gameplay code.
 */
import { getLevelConfig } from "../levels/levels";

export const SCORING = {
  base: 1000,
  cluePoints: 60,
  explorationPoints: 40,
  hintPenalty: 90,
  wrongGatePenalty: 120,
  /** points lost per second over the 3-star target */
  timePenaltyPerSec: 3,
  minimum: 50,
};

export interface RunStats {
  level: number;
  timeMs: number;
  cluesFound: number;
  cluesTotal: number;
  hintsUsed: number;
  wrongGates: number;
  secretsFound: number;
}

export interface RunResult extends RunStats {
  score: number;
  stars: 1 | 2 | 3;
  xp: number;
}

export function rateRun(stats: RunStats): RunResult {
  const { starTimeSec } = getLevelConfig(stats.level).difficulty;
  const sec = stats.timeMs / 1000;

  const over = Math.max(0, sec - starTimeSec[0]);
  const raw =
    SCORING.base +
    stats.cluesFound * SCORING.cluePoints +
    stats.secretsFound * SCORING.explorationPoints -
    stats.hintsUsed * SCORING.hintPenalty -
    stats.wrongGates * SCORING.wrongGatePenalty -
    Math.round(over * SCORING.timePenaltyPerSec);
  const score = Math.max(SCORING.minimum, Math.round(raw));

  let stars: 1 | 2 | 3 = 1;
  if (sec <= starTimeSec[0] && stats.hintsUsed === 0 && stats.wrongGates === 0) stars = 3;
  else if (sec <= starTimeSec[1] && stats.hintsUsed + stats.wrongGates <= 1) stars = 2;

  const xp = stats.cluesFound * 10 + stats.secretsFound * 15 + stars * 20;
  return { ...stats, score, stars, xp };
}

export const STAR_LABEL: Record<1 | 2 | 3, string> = {
  3: "EXCELLENT",
  2: "GOOD",
  1: "COMPLETED",
};
