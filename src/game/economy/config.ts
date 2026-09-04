/**
 * Economy balance sheet — every reward value lives here so the game can be
 * re-balanced without touching gameplay or UI code.
 */
export const ECONOMY = {
  coins: {
    /** level completion payout by star rating */
    byStars: { 1: 20, 2: 35, 3: 50 } as Record<1 | 2 | 3, number>,
    firstCompletion: 25,
    /** hidden cache payout scales with the level's difficulty tier */
    cacheByTier: { easy: 10, medium: 16, hard: 22, "very-hard": 26, special: 30 } as Record<
      string,
      number
    >,
    clueMin: 3,
    clueMax: 8,
    /** small bonus for finishing without a single hint */
    noHintBonus: 15,
  },
  xp: {
    /** level XP scales from this base with the level index */
    completionBase: 50,
    completionPerLevel: 10,
    clue: 10,
    cache: 20,
    threeStarBonus: 25,
    twoStarBonus: 10,
    noHintBonus: 15,
  },
  /** XP needed to go from player level n to n+1 */
  progression: {
    base: 100,
    growth: 1.45,
  },
  daily: {
    cycle: [50, 75, 100, 125, 150, 200, 300],
    /** day 7 also grants XP */
    finalDayXp: 100,
  },
} as const;

/** XP required to advance from `playerLevel` to the next one. */
export function xpForLevel(playerLevel: number): number {
  const { base, growth } = ECONOMY.progression;
  return Math.round((base * Math.pow(growth, playerLevel - 1)) / 25) * 25;
}

/** Convert a total XP amount into { level, into, needed }. */
export function levelFromXp(totalXp: number) {
  let level = 1;
  let remaining = Math.max(0, totalXp);
  let needed = xpForLevel(level);
  while (remaining >= needed && level < 999) {
    remaining -= needed;
    level += 1;
    needed = xpForLevel(level);
  }
  return { level, into: remaining, needed };
}
