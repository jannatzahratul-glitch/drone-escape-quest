import { useSyncExternalStore } from "react";
import { ECONOMY, levelFromXp, xpForLevel } from "./config";

/**
 * EconomyService — the single source of truth for coins, XP, player level,
 * the daily reward cycle and the reward ledger that keeps every payout
 * idempotent (no double rewards from reloads or re-opened screens).
 *
 * Local persistence only; the daily reward is a prototype and is explicitly
 * NOT secure against device-clock manipulation. The claim logic is isolated in
 * this module so it can later be swapped for server validation.
 */
const KEY = "maze-escape:economy:v1";

export interface RewardEntry {
  id: string;
  coins: number;
  xp: number;
  reason: string;
  at: number;
}

export interface EconomyState {
  coins: number;
  xp: number;
  /** ids of rewards already granted — idempotency ledger */
  claimed: string[];
  history: RewardEntry[];
  daily: {
    /** 1..7 position in the current cycle */
    day: number;
    /** YYYY-MM-DD of the last claim, local time */
    lastClaim: string | null;
  };
}

const EMPTY: EconomyState = {
  coins: 0,
  xp: 0,
  claimed: [],
  history: [],
  daily: { day: 1, lastClaim: null },
};

import { queuePersist } from "../save/persistQueue";

let state: EconomyState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function persist() {
  queuePersist(KEY, () => localStorage.setItem(KEY, JSON.stringify(state)));
}

function set(patch: Partial<EconomyState>) {
  state = { ...state, ...patch };
  persist();
  emit();
}

/** Load (and migrate) the economy. `legacyXp` seeds XP from older saves. */
export function loadEconomy(legacyXp = 0) {
  if (loaded || typeof window === "undefined") return state;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<EconomyState>;
      state = {
        coins: Math.max(0, Number(p.coins) || 0),
        xp: Math.max(0, Number(p.xp) || 0),
        claimed: Array.isArray(p.claimed) ? p.claimed.map(String) : [],
        history: Array.isArray(p.history) ? (p.history as RewardEntry[]) : [],
        daily: {
          day: Math.min(7, Math.max(1, Number(p.daily?.day) || 1)),
          lastClaim: p.daily?.lastClaim ?? null,
        },
      };
    } else {
      // backward compatible: adopt XP already earned under the old save format
      state = { ...EMPTY, xp: Math.max(0, legacyXp) };
      persist();
    }
  } catch {
    state = EMPTY;
  }
  emit();
  return state;
}

export const getEconomy = () => state;

export function useEconomy<T>(selector: (s: EconomyState) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selector(state),
    () => selector(state),
  );
}

export interface GrantResult {
  granted: boolean;
  coins: number;
  xp: number;
  /** player level before / after the grant */
  levelBefore: number;
  levelAfter: number;
}

const noGrant = (): GrantResult => {
  const l = levelFromXp(state.xp).level;
  return { granted: false, coins: 0, xp: 0, levelBefore: l, levelAfter: l };
};

/**
 * Keep the ledger bounded: permanent one-off ids (clue/cache/first/daily) are
 * always kept, per-run ids only for the most recent 50 attempts.
 */
function pruneClaimed(ids: string[]) {
  const runs = ids.filter((i) => i.startsWith("run:"));
  if (runs.length <= 50) return ids;
  const keep = new Set(runs.slice(-50));
  return ids.filter((i) => !i.startsWith("run:") || keep.has(i));
}

/** Core idempotent grant. Returns granted:false when `id` was already paid. */
function grant(id: string, coins: number, xp: number, reason: string): GrantResult {
  if (state.claimed.includes(id)) return noGrant();
  const levelBefore = levelFromXp(state.xp).level;
  const entry: RewardEntry = { id, coins, xp, reason, at: Date.now() };
  set({
    coins: Math.max(0, state.coins + coins),
    xp: Math.max(0, state.xp + xp),
    claimed: pruneClaimed([...state.claimed, id]),
    history: [entry, ...state.history].slice(0, 60),
  });
  return {
    granted: true,
    coins,
    xp,
    levelBefore,
    levelAfter: levelFromXp(state.xp).level,
  };
}

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface DailyStatus {
  day: number;
  reward: number;
  xp: number;
  canClaim: boolean;
  /** ms until the next calendar day begins */
  msUntilNext: number;
  cycle: number[];
  claimedToday: boolean;
}

export const economy = {
  getCoins: () => state.coins,
  getXP: () => state.xp,
  getPlayerLevel: () => levelFromXp(state.xp).level,
  getXPProgress: () => levelFromXp(state.xp),
  getXPForNextLevel: () => xpForLevel(levelFromXp(state.xp).level),
  getRewardHistory: () => state.history,
  hasClaimed: (id: string) => state.claimed.includes(id),

  addCoins(amount: number, reason = "bonus") {
    if (amount <= 0) return;
    set({
      coins: state.coins + amount,
      history: [
        { id: `ad-hoc:${Date.now()}`, coins: amount, xp: 0, reason, at: Date.now() },
        ...state.history,
      ].slice(0, 60),
    });
  },
  /** Never allows a negative balance; returns false when unaffordable. */
  spendCoins(amount: number) {
    if (amount <= 0 || state.coins < amount) return false;
    set({ coins: state.coins - amount });
    return true;
  },
  addXP(amount: number, reason = "bonus") {
    if (amount <= 0) return;
    set({
      xp: state.xp + amount,
      history: [
        { id: `xp:${Date.now()}`, coins: 0, xp: amount, reason, at: Date.now() },
        ...state.history,
      ].slice(0, 60),
    });
  },

  /** One-shot grant with an explicit reward id. */
  grantOnce: grant,

  /** Clue discovered — paid once per level+clue, ever. */
  grantClue(level: number, clueId: number, coins: number) {
    return grant(`clue:${level}:${clueId}`, coins, ECONOMY.xp.clue, "Clue discovered");
  },
  /** Hidden cache — paid once per level+cache, ever. */
  grantCache(level: number, index: number, coins: number) {
    return grant(`cache:${level}:${index}`, coins, ECONOMY.xp.cache, "Hidden cache");
  },

  daily(): DailyStatus {
    const today = todayKey();
    const claimedToday = state.daily.lastClaim === today;
    const day = state.daily.day;
    const next = new Date();
    next.setHours(24, 0, 0, 0);
    return {
      day,
      reward: ECONOMY.daily.cycle[day - 1]!,
      xp: day === 7 ? ECONOMY.daily.finalDayXp : 0,
      canClaim: !claimedToday,
      claimedToday,
      msUntilNext: next.getTime() - Date.now(),
      cycle: [...ECONOMY.daily.cycle],
    };
  },

  /** Claim today's daily reward. Idempotent per calendar day. */
  claimDailyReward(): GrantResult {
    const status = economy.daily();
    if (!status.canClaim) return noGrant();
    const today = todayKey();
    const levelBefore = levelFromXp(state.xp).level;
    const entry: RewardEntry = {
      id: `daily:${today}`,
      coins: status.reward,
      xp: status.xp,
      reason: `Daily reward · day ${status.day}`,
      at: Date.now(),
    };
    set({
      coins: state.coins + status.reward,
      xp: state.xp + status.xp,
      claimed: [...state.claimed, entry.id],
      history: [entry, ...state.history].slice(0, 60),
      daily: { day: status.day >= 7 ? 1 : status.day + 1, lastClaim: today },
    });
    return {
      granted: true,
      coins: status.reward,
      xp: status.xp,
      levelBefore,
      levelAfter: levelFromXp(state.xp).level,
    };
  },

  /** Development / testing helper. */
  reset() {
    state = EMPTY;
    persist();
    emit();
  },
};
