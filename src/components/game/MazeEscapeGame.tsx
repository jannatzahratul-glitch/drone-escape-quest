import { useEffect } from "react";
import { GameScene } from "@/game/scene/GameScene";
import { installKeyboard, resetInput } from "@/game/input/input";
import { actions, useGame } from "@/game/state/gameStore";
import type { Gate } from "@/game/maze/generator";
import { Hud } from "./Hud";
import { LevelCompleteScreen, PauseScreen, StartScreen } from "./Overlays";

/**
 * Top-level game shell: owns nothing but composition.
 * 3D engine (GameScene) and UI (Hud/overlays) stay fully separated.
 */
export function MazeEscapeGame() {
  const phase = useGame((s) => s.phase);
  const level = useGame((s) => s.level);
  const runKey = useGame((s) => s.runKey);

  useEffect(() => installKeyboard(), []);
  useEffect(() => {
    resetInput();
  }, [runKey, phase]);

  // block page scroll / pull-to-refresh while playing
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const inGame = phase !== "menu";

  const handleGate = (gate: Gate) => {
    if (import.meta.env.DEV && typeof window !== "undefined") {
      const w = window as unknown as Record<string, unknown>;
      const log = (w["__gateLog"] as Gate[]) ?? [];
      log.push(gate);
      w["__gateLog"] = log;
    }
    if (gate.isReal) actions.complete();
    else actions.notify("This gate is sealed — a dead end. Keep searching.");
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-background">
      <GameScene
        key={inGame ? `run-${runKey}` : "menu"}
        level={inGame ? level : 1}
        paused={phase !== "playing"}
        cinematic={!inGame}
        onGate={handleGate}
        onLeaveGate={() => {
          /* the warning fades on its own timer */
        }}
      />

      {phase === "playing" || phase === "paused" ? <Hud /> : null}
      {phase === "menu" && <StartScreen />}
      {phase === "paused" && <PauseScreen />}
      {phase === "complete" && <LevelCompleteScreen />}
    </main>
  );
}
