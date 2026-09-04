import { useSyncExternalStore } from "react";
import { TOTAL_LEVELS } from "../levels/levels";

/**
 * SaveManager — local progress persistence (no accounts).
 * Stores unlocked levels, completed levels and best time per level.
 */
const KEY = "maze-escape:progress:v1";

export interface Progress {
  /** highest level the player may enter */
  unlocked: number;
  completed: number[];
  /** level id -> best time in ms */
  bestMs: Record<number, number>;
}

const EMPTY: Progress = { unlocked: 1, completed: [], bestMs: {} };

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
        bestMs: parsed.bestMs && typeof parsed.bestMs === "object" ? parsed.bestMs : {},
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

export const saveActions = {
  /** Record a completed level. Returns whether it is a new best time. */
  completeLevel(level: number, timeMs: number) {
    const prevBest = progress.bestMs[level];
    const isBest = prevBest === undefined || timeMs < prevBest;
    progress = {
      unlocked: Math.max(progress.unlocked, Math.min(TOTAL_LEVELS, level + 1)),
      completed: progress.completed.includes(level)
        ? progress.completed
        : [...progress.completed, level],
      bestMs: { ...progress.bestMs, [level]: isBest ? timeMs : prevBest! },
    };
    persist();
    emit();
    return isBest;
  },
  reset() {
    progress = { ...EMPTY, completed: [], bestMs: {} };
    persist();
    emit();
  },
};

export const isUnlocked = (level: number) => level <= progress.unlocked;
export const isCompleted = (level: number) => progress.completed.includes(level);
export const bestTime = (level: number) => progress.bestMs[level];
