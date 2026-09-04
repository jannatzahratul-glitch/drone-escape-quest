import { useEffect } from "react";
import { GameScene } from "@/game/scene/GameScene";
import { installKeyboard, resetInput } from "@/game/input/input";
import { actions, useGame } from "@/game/state/gameStore";
import { loadProgress } from "@/game/save/SaveManager";
import { loadSettings } from "@/game/settings/SettingsManager";
import { playCue, vibrate } from "@/game/audio/AudioManager";
import type { Gate } from "@/game/maze/generator";
import { Hud } from "./Hud";
import { EscapingOverlay, LevelCompleteScreen, PauseScreen, StartScreen } from "./Overlays";
import { LevelSelectScreen } from "./LevelSelect";
import { SettingsScreen } from "./SettingsScreen";

/**
 * Top-level game shell: owns nothing but composition.
 * 3D engine (GameScene) and UI (HUD / screens) stay fully separated.
 */
export function MazeEscapeGame() {
  const phase = useGame((s) => s.phase);
  const level = useGame((s) => s.level);
  const runKey = useGame((s) => s.runKey);
  const openGateId = useGame((s) => s.openGateId);

  useEffect(() => {
    loadProgress();
    loadSettings();
  }, []);
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

  const inGame = phase === "playing" || phase === "paused" || phase === "escaping" || phase === "complete";

  const handleGate = (gate: Gate) => {
    if (gate.isReal) {
      playCue("gate-open");
      vibrate([20, 40, 60]);
      actions.escape(gate.id);
    } else {
      playCue("gate-locked");
      vibrate(35);
      actions.notify("Locked. Not the way out.");
    }
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-background">
      <GameScene
        key={inGame ? `run-${runKey}` : "menu"}
        level={inGame ? level : 1}
        paused={phase !== "playing"}
        cinematic={!inGame}
        openGateId={openGateId}
        onGate={handleGate}
        onLeaveGate={() => {
          /* the warning fades on its own timer */
        }}
      />

      {(phase === "playing" || phase === "paused" || phase === "escaping") && <Hud />}
      {phase === "menu" && <StartScreen />}
      {phase === "levels" && <LevelSelectScreen />}
      {phase === "settings" && <SettingsScreen />}
      {phase === "paused" && <PauseScreen />}
      {phase === "escaping" && <EscapingOverlay />}
      {phase === "complete" && <LevelCompleteScreen />}
    </main>
  );
}
