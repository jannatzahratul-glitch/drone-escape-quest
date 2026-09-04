import { useSyncExternalStore } from "react";
import { TOTAL_LEVELS } from "../levels/levels";

/**
 * SaveManager — local progress persistence (no accounts).
 * Unlocked levels, completed levels, best time, stars, best score, XP and the
 * clues the player has discovered per level.
 */
const KEY = "maze-escape:progress:v1";

export interface Progress {
  /** highest level the player may enter */
  unlocked: number;
  completed: number[];
  /** level id -> best time in ms */
  bestMs: Record<number, number>;
  /** level id -> best star rating (1..3) */
  stars: Record<number, number>;
  /** level id -> best score */
  bestScore: Record<number, number>;
  /** level id -> discovered clue ids */
  clues: Record<number, number[]>;
  xp: number;
}

const EMPTY: Progress = {
  unlocked: 1,
  completed: [],
  bestMs: {},
  stars: {},
  bestScore: {},
  clues: {},
  xp: 0,
};

let progress: Progress = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    /* storage unavailable — progress stays in memory for this session */
  }
}

const record = (v: unknown): Record<number, never> =>
  v && typeof v === "object" ? (v as Record<number, never>) : {};

export function loadProgress() {
  if (loaded || typeof window === "undefined") return progress;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Progress>;
      progress = {
        unlocked: Math.max(1, Number(parsed.unlocked) || 1),
        completed: Array.isArray(parsed.completed) ? parsed.completed.map(Number) : [],
        bestMs: record(parsed.bestMs),
        stars: record(parsed.stars),
        bestScore: record(parsed.bestScore),
        clues: record(parsed.clues),
        xp: Number(parsed.xp) || 0,
      };
    }
  } catch {
    progress = EMPTY;
  }
  emit();
  return progress;
}

export const getProgress = () => progress;

export function useProgress<T>(selector: (p: Progress) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => selector(progress),
    () => selector(progress),
  );
}

export interface CompletionRecord {
  timeMs: number;
  stars: number;
  score: number;
  xp: number;
  clueIds: number[];
}

export const saveActions = {
  /** Record a completed level. Returns whether it is a new best time. */
  completeLevel(level: number, result: CompletionRecord) {
    const prevBest = progress.bestMs[level];
    const isBest = prevBest === undefined || result.timeMs < prevBest;
    progress = {
      ...progress,
      unlocked: Math.max(progress.unlocked, Math.min(TOTAL_LEVELS, level + 1)),
      completed: progress.completed.includes(level)
        ? progress.completed
        : [...progress.completed, level],
      bestMs: { ...progress.bestMs, [level]: isBest ? result.timeMs : prevBest! },
      stars: { ...progress.stars, [level]: Math.max(progress.stars[level] ?? 0, result.stars) },
      bestScore: {
        ...progress.bestScore,
        [level]: Math.max(progress.bestScore[level] ?? 0, result.score),
      },
      xp: progress.xp + result.xp,
    };
    saveActions.recordClues(level, result.clueIds);
    persist();
    emit();
    return isBest;
  },
  /** Remember which clues have ever been discovered on a level. */
  recordClues(level: number, ids: number[]) {
    const merged = Array.from(new Set([...(progress.clues[level] ?? []), ...ids]));
    progress = { ...progress, clues: { ...progress.clues, [level]: merged } };
    persist();
    emit();
  },
  addXp(amount: number) {
    progress = { ...progress, xp: progress.xp + amount };
    persist();
    emit();
  },
  reset() {
    progress = { ...EMPTY, completed: [], bestMs: {}, stars: {}, bestScore: {}, clues: {} };
    persist();
    emit();
  },
};

export const isUnlocked = (level: number) => level <= progress.unlocked;
export const isCompleted = (level: number) => progress.completed.includes(level);
export const bestTime = (level: number) => progress.bestMs[level];
export const levelStars = (level: number) => progress.stars[level] ?? 0;
