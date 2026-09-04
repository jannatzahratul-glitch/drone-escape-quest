import { useSyncExternalStore } from "react";
import { saveActions } from "../save/SaveManager";

/**
 * Modular game-state manager.
 *
 * A tiny external store (no provider needed) so both the 3D scene and the DOM
 * HUD read the same state.
 */
export type GamePhase =
  | "menu"
  | "levels"
  | "settings"
  | "playing"
  | "paused"
  | "escaping"
  | "complete";

export interface GameState {
  phase: GamePhase;
  level: number;
  /** bumped on every (re)start so the 3D scene remounts cleanly */
  runKey: number;
  accumulatedMs: number;
  segmentStart: number;
  finalMs: number;
  bestMs: number | null;
  isNewBest: boolean;
  /** id of the gate currently opening (real exit) */
  openGateId: number | null;
  notice: { text: string; at: number } | null;
}

let state: GameState = {
  phase: "menu",
  level: 1,
  runKey: 0,
  accumulatedMs: 0,
  segmentStart: 0,
  finalMs: 0,
  bestMs: null,
  isNewBest: false,
  openGateId: null,
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
      bestMs: null,
      isNewBest: false,
      openGateId: null,
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
    set({ phase: "paused", accumulatedMs: getElapsedMs(), segmentStart: 0 });
  },
  resume() {
    if (state.phase !== "paused") return;
    set({ phase: "playing", segmentStart: Date.now() });
  },
  /** real exit reached: gate opens, short cinematic beat, then the results */
  escape(gateId: number) {
    if (state.phase !== "playing") return;
    const finalMs = getElapsedMs();
    set({ phase: "escaping", finalMs, segmentStart: 0, openGateId: gateId, notice: null });
    window.setTimeout(() => {
      if (getState().phase !== "escaping") return;
      const isNewBest = saveActions.completeLevel(state.level, finalMs);
      set({
        phase: "complete",
        isNewBest,
        bestMs: Math.min(finalMs, state.bestMs ?? finalMs),
      });
    }, 1700);
  },
  showLevels() {
    set({ phase: "levels", segmentStart: 0, notice: null });
  },
  showSettings() {
    set({ phase: "settings", segmentStart: 0, notice: null });
  },
  mainMenu() {
    set({
      phase: "menu",
      segmentStart: 0,
      accumulatedMs: 0,
      notice: null,
      openGateId: null,
    });
  },
  notify(text: string) {
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
