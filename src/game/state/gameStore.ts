import { useSyncExternalStore } from "react";

/**
 * Modular game-state manager.
 *
 * A tiny external store (no provider needed) so both the 3D scene and the DOM
 * HUD read the same state. New phases (gameOver, revive, shop, dailyChallenge)
 * can be added to GamePhase without touching existing screens.
 */
export type GamePhase = "menu" | "loading" | "playing" | "paused" | "complete";

export interface GameState {
  phase: GamePhase;
  level: number;
  /** bumped on every (re)start so the 3D scene remounts cleanly */
  runKey: number;
  /** ms accumulated in previous play segments of this run */
  accumulatedMs: number;
  /** timestamp when the current playing segment started (0 when not playing) */
  segmentStart: number;
  /** final time captured on level complete */
  finalMs: number;
  /** transient message, e.g. "this gate is sealed" */
  notice: { text: string; at: number } | null;
}

let state: GameState = {
  phase: "menu",
  level: 1,
  runKey: 0,
  accumulatedMs: 0,
  segmentStart: 0,
  finalMs: 0,
  notice: null,
};

const listeners = new Set<() => void>();
const set = (patch: Partial<GameState>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const getState = () => state;
export function useGame<T>(selector: (s: GameState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

/** Elapsed play time of the current run, in ms (pause-aware). */
export function getElapsedMs(s: GameState = state) {
  if (s.phase === "complete") return s.finalMs;
  return s.accumulatedMs + (s.segmentStart ? Date.now() - s.segmentStart : 0);
}

export const actions = {
  startLevel(level: number) {
    set({
      phase: "playing",
      level,
      runKey: state.runKey + 1,
      accumulatedMs: 0,
      segmentStart: Date.now(),
      finalMs: 0,
      notice: null,
    });
  },
  restart() {
    actions.startLevel(state.level);
  },
  nextLevel() {
    actions.startLevel(state.level + 1);
  },
  pause() {
    if (state.phase !== "playing") return;
    set({
      phase: "paused",
      accumulatedMs: getElapsedMs(),
      segmentStart: 0,
    });
  },
  resume() {
    if (state.phase !== "paused") return;
    set({ phase: "playing", segmentStart: Date.now() });
  },
  complete() {
    if (state.phase !== "playing") return;
    set({ phase: "complete", finalMs: getElapsedMs(), segmentStart: 0 });
  },
  mainMenu() {
    set({ phase: "menu", segmentStart: 0, accumulatedMs: 0, notice: null });
  },
  notify(text: string) {
    // re-showing the same warning is fine once the previous one has expired
    if (state.notice && state.notice.text === text) return;
    set({ notice: { text, at: Date.now() } });
  },
  clearNotice() {
    if (state.notice) set({ notice: null });
  },
};

export function formatTime(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
