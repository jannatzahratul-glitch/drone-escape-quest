import { useSyncExternalStore } from "react";
import { saveActions } from "../save/SaveManager";
import { buildLevel } from "../levels/levelBuilder";
import { getLevelConfig } from "../levels/levels";
import { rateRun, type RunResult } from "../progression/scoring";
import { nextHint } from "../hints/hints";
import type { Clue } from "../clues/clueSystem";
import { economy } from "../economy/EconomyService";
import { ECONOMY } from "../economy/config";
import { grantCompletion, type CompletionRewards } from "../economy/levelRewards";
import { isCompleted } from "../save/SaveManager";
import { markSafePoint } from "../rewards/revive";

/**
 * Modular game-state manager.
 *
 * A tiny external store (no provider needed) so both the 3D scene and the DOM
 * HUD read the same state. It also owns the run-scoped exploration state:
 * discovered clues, hints used, wrong gates and XP.
 */
export type GamePhase =
  | "menu"
  | "levels"
  | "settings"
  | "playing"
  | "paused"
  | "escaping"
  | "complete"
  | "daily";

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
  notice: { text: string; at: number; tone: "info" | "warn" | "reward" } | null;
  /** clue discovered a moment ago — shown as a card, then dismissed */
  clueFlash: Clue | null;
  discoveredClueIds: number[];
  secretsFound: number[];
  hintsUsed: number;
  hintText: string | null;
  wrongGates: number;
  visitedGates: number[];
  cluePanelOpen: boolean;
  playerCell: { x: number; y: number } | null;
  /** brief darkening pulse after a wrong gate on harder levels */
  penaltyFlash: number;
  /** gate the player is standing next to (prompt "ENTER") */
  nearGate: number | null;
  /** tutorial beats already shown this run */
  taught: string[];
  result: RunResult | null;
  xp: number;
  /** coin/XP breakdown of the finished run (granted exactly once) */
  rewards: CompletionRewards | null;
  /** set while the "LEVEL UP" beat plays over the results */
  levelUp: number | null;
}

const RUN_DEFAULTS = {
  accumulatedMs: 0,
  finalMs: 0,
  bestMs: null,
  isNewBest: false,
  openGateId: null,
  notice: null,
  clueFlash: null,
  discoveredClueIds: [] as number[],
  secretsFound: [] as number[],
  hintsUsed: 0,
  hintText: null,
  wrongGates: 0,
  visitedGates: [] as number[],
  cluePanelOpen: false,
  playerCell: null,
  penaltyFlash: 0,
  nearGate: null as number | null,
  taught: [] as string[],
  result: null,
  xp: 0,
  rewards: null,
  levelUp: null,
};

let state: GameState = {
  phase: "menu",
  level: 1,
  runKey: 0,
  segmentStart: 0,
  ...RUN_DEFAULTS,
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

export const hintsLeft = (s: GameState = state) =>
  Math.max(0, getLevelConfig(s.level).difficulty.hintLimit - s.hintsUsed);

export const actions = {
  startLevel(level: number) {
    set({
      phase: "playing",
      level,
      runKey: state.runKey + 1,
      segmentStart: Date.now(),
      ...RUN_DEFAULTS,
      notice: { text: "Explore the maze.", at: Date.now(), tone: "info" },
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
  setPlayerCell(cell: { x: number; y: number }) {
    const p = state.playerCell;
    if (p && p.x === cell.x && p.y === cell.y) return;
    markSafePoint(cell);
    set({ playerCell: cell });
  },

  /** a carved stone was reached */
  discoverClue(clue: Clue) {
    if (state.discoveredClueIds.includes(clue.id)) return;
    const first = state.discoveredClueIds.length === 0;
    set({
      discoveredClueIds: [...state.discoveredClueIds, clue.id],
      clueFlash: clue,
      xp: state.xp + clue.xp,
      notice: {
        text: first ? "Somewhere in this maze is the way out." : `+${clue.xp} XP`,
        at: Date.now(),
        tone: "reward",
      },
    });
    const tierIdx = ["easy", "medium", "hard", "very-hard", "special"].indexOf(
      getLevelConfig(state.level).difficulty.tier,
    );
    const coins = Math.round(
      ECONOMY.coins.clueMin +
        ((ECONOMY.coins.clueMax - ECONOMY.coins.clueMin) * Math.max(0, tierIdx)) / 4,
    );
    economy.grantClue(state.level, clue.id, coins);
    saveActions.recordClues(state.level, [clue.id]);
  },
  clearClueFlash() {
    if (state.clueFlash) set({ clueFlash: null });
  },
  discoverSecret(index: number) {
    if (state.secretsFound.includes(index)) return;
    const tier = getLevelConfig(state.level).difficulty.tier as string;
    const coins = ECONOMY.coins.cacheByTier[tier] ?? ECONOMY.coins.cacheByTier["medium"]!;
    const grant = economy.grantCache(state.level, index, coins);
    set({
      secretsFound: [...state.secretsFound, index],
      xp: state.xp + ECONOMY.xp.cache,
      notice: {
        text: grant.granted
          ? `HIDDEN CACHE · +${coins} coins`
          : "HIDDEN CACHE · already claimed",
        at: Date.now(),
        tone: "reward",
      },
    });
  },

  setNearGate(id: number | null) {
    if (state.nearGate === id) return;
    const patch: Partial<GameState> = { nearGate: id };
    if (id !== null && !state.taught.includes("gate")) {
      patch.taught = [...state.taught, "gate"];
      patch.notice = { text: "Not every gate leads outside.", at: Date.now(), tone: "info" };
    }
    set(patch);
  },

  toggleCluePanel() {
    set({ cluePanelOpen: !state.cluePanelOpen, hintText: null });
  },
  useHint() {
    if (state.phase !== "playing" || hintsLeft() <= 0) return;
    const text = nextHint({
      level: state.level,
      discoveredClueIds: state.discoveredClueIds,
      wrongGates: state.wrongGates,
      playerCell: state.playerCell,
      visitedGates: state.visitedGates,
    });
    set({ hintsUsed: state.hintsUsed + 1, hintText: text });
  },
  clearHint() {
    if (state.hintText) set({ hintText: null });
  },

  /** player stood in a gate that is not the exit */
  wrongGate(gateId: number) {
    if (state.phase !== "playing") return;
    const penalty = getLevelConfig(state.level).difficulty.penalty;
    const alreadyTried = state.visitedGates.includes(gateId);
    set({
      wrongGates: state.wrongGates + 1,
      visitedGates: alreadyTried ? state.visitedGates : [...state.visitedGates, gateId],
      accumulatedMs: getElapsedMs() + penalty.timeMs,
      segmentStart: Date.now(),
      penaltyFlash: penalty.darkness ? Date.now() : 0,
      notice: {
        text: penalty.timeMs ? `DEAD END · +${penalty.timeMs / 1000}s` : "DEAD END",
        at: Date.now(),
        tone: "warn",
      },
    });
  },

  /** real exit reached: gate opens, short cinematic beat, then the results */
  escape(gateId: number) {
    if (state.phase !== "playing") return;
    const finalMs = getElapsedMs();
    set({ phase: "escaping", finalMs, segmentStart: 0, openGateId: gateId, notice: null });
    window.setTimeout(() => {
      if (getState().phase !== "escaping") return;
      const build = buildLevel(state.level);
      const result = rateRun({
        level: state.level,
        timeMs: finalMs,
        cluesFound: state.discoveredClueIds.length,
        cluesTotal: build.clues.length,
        hintsUsed: state.hintsUsed,
        wrongGates: state.wrongGates,
        secretsFound: state.secretsFound.length,
      });
      const firstCompletion = !isCompleted(state.level);
      const isNewBest = saveActions.completeLevel(state.level, {
        timeMs: finalMs,
        stars: result.stars,
        score: result.score,
        xp: result.xp + state.xp,
        clueIds: state.discoveredClueIds,
      });
      const rewards = grantCompletion(
        state.level,
        `${state.level}:${state.runKey}`,
        result,
        firstCompletion,
      );
      set({
        phase: "complete",
        isNewBest,
        result,
        rewards,
        levelUp: rewards.leveledUp ? rewards.levelAfter : null,
        bestMs: Math.min(finalMs, state.bestMs ?? finalMs),
      });
    }, 1700);
  },
  clearLevelUp() {
    if (state.levelUp !== null) set({ levelUp: null });
  },
  showDaily() {
    set({ phase: "daily", segmentStart: 0, notice: null });
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
      cluePanelOpen: false,
    });
  },
  notify(text: string, tone: "info" | "warn" | "reward" = "info") {
    if (state.notice && state.notice.text === text) return;
    set({ notice: { text, at: Date.now(), tone } });
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
