import { getLevelConfig } from "../levels/levels";
import type { RunResult } from "../progression/scoring";
import { ECONOMY } from "./config";
import { economy, type GrantResult } from "./EconomyService";

/**
 * Level completion payout. Coin/XP lines are computed here (pure) and granted
 * through the economy ledger with a unique reward id, so re-rendering the
 * completion screen or reloading can never pay twice.
 */
export interface RewardLine {
  label: string;
  value: number;
}

export interface CompletionRewards {
  coinLines: RewardLine[];
  xpLines: RewardLine[];
  coinTotal: number;
  xpTotal: number;
  firstCompletion: boolean;
  levelBefore: number;
  levelAfter: number;
  leveledUp: boolean;
}

export function computeCompletionRewards(
  level: number,
  result: RunResult,
  firstCompletion: boolean,
): { coinLines: RewardLine[]; xpLines: RewardLine[]; coinTotal: number; xpTotal: number } {
  const tier = getLevelConfig(level).difficulty.tier as string;
  const coinLines: RewardLine[] = [
    { label: "Level Reward", value: ECONOMY.coins.byStars[result.stars] },
  ];
  if (firstCompletion) {
    coinLines.push({ label: "First Completion", value: ECONOMY.coins.firstCompletion });
  }
  if (result.secretsFound > 0) {
    const per = ECONOMY.coins.cacheByTier[tier] ?? ECONOMY.coins.cacheByTier['medium']!;
    coinLines.push({ label: "Exploration", value: result.secretsFound * per });
  }
  if (result.hintsUsed === 0) {
    coinLines.push({ label: "No Hints", value: ECONOMY.coins.noHintBonus });
  }

  const xpLines: RewardLine[] = [
    {
      label: "Level XP",
      value: ECONOMY.xp.completionBase + (level - 1) * ECONOMY.xp.completionPerLevel,
    },
  ];
  if (result.cluesFound > 0) {
    xpLines.push({ label: "Clue XP", value: result.cluesFound * ECONOMY.xp.clue });
  }
  if (result.stars === 3) xpLines.push({ label: "Star Bonus", value: ECONOMY.xp.threeStarBonus });
  else if (result.stars === 2) xpLines.push({ label: "Star Bonus", value: ECONOMY.xp.twoStarBonus });
  if (result.hintsUsed === 0) xpLines.push({ label: "No Hints", value: ECONOMY.xp.noHintBonus });

  const sum = (l: RewardLine[]) => l.reduce((a, b) => a + b.value, 0);
  return { coinLines, xpLines, coinTotal: sum(coinLines), xpTotal: sum(xpLines) };
}

/**
 * Grant the completion payout exactly once per finished run.
 * `runId` must be unique per run (level + run counter).
 */
export function grantCompletion(
  level: number,
  runId: string,
  result: RunResult,
  firstCompletion: boolean,
): CompletionRewards {
  const first = firstCompletion && !economy.hasClaimed(`first:${level}`);
  const lines = computeCompletionRewards(level, result, first);
  let g: GrantResult = economy.grantOnce(
    `run:${runId}`,
    lines.coinTotal,
    lines.xpTotal,
    `Level ${level} complete`,
  );
  if (first) {
    // mark the one-time bonus so a replay never pays it again
    economy.grantOnce(`first:${level}`, 0, 0, `Level ${level} first completion`);
  }
  if (!g.granted) {
    const lvl = economy.getPlayerLevel();
    g = { granted: false, coins: 0, xp: 0, levelBefore: lvl, levelAfter: lvl };
  }
  return {
    ...lines,
    firstCompletion: first,
    levelBefore: g.levelBefore,
    levelAfter: g.levelAfter,
    leveledUp: g.levelAfter > g.levelBefore,
  };
}
