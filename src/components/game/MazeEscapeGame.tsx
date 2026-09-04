import { Suspense, lazy, useEffect } from "react";
import { installKeyboard, resetInput } from "@/game/input/input";
import { actions, useGame } from "@/game/state/gameStore";
import { loadProgress, getProgress } from "@/game/save/SaveManager";
import { loadEconomy } from "@/game/economy/EconomyService";
import { loadSettings, getSettings } from "@/game/settings/SettingsManager";
import { AudioManager, playCue } from "@/game/audio/AudioManager";
import { haptics } from "@/game/haptics/HapticManager";
import type { Gate } from "@/game/maze/generator";
import { Hud } from "./Hud";
import { EscapingOverlay, LevelCompleteScreen, PauseScreen } from "./Overlays";
import { MainMenu } from "./MainMenu";
import { MenuBackdrop } from "./MenuBackdrop";
import { LoadingScreen } from "./LoadingScreen";
import { LevelMapScreen } from "./map/LevelMap";
import { SettingsScreen } from "./SettingsScreen";
import { DailyRewardScreen } from "./economy/DailyRewardScreen";

/** Heavy Three.js gameplay chunk — only fetched when a level actually starts. */
const GameScene = lazy(() =>
  import("@/game/scene/GameScene").then((m) => ({ default: m.GameScene })),
);

/**
 * Top-level game shell: owns nothing but composition.
 * 3D engine (GameScene) and UI (HUD / screens) stay fully separated.
 */
export function MazeEscapeGame() {
  const phase = useGame((s) => s.phase);
  const level = useGame((s) => s.level);
  const runKey = useGame((s) => s.runKey);
  const openGateId = useGame((s) => s.openGateId);
  const settingsFrom = useGame((s) => s.settingsFrom);

  useEffect(() => {
    loadProgress();
    loadEconomy(getProgress().xp);
    loadSettings();
  }, []);
  useEffect(() => installKeyboard(), []);
  useEffect(() => {
    resetInput();
  }, [runKey, phase]);

  // audio starts after the first gesture (mobile autoplay policies) and is
  // fully torn down when the shell unmounts
  useEffect(() => {
    const start = () => {
      AudioManager.unlock();
      if (getSettings().music) AudioManager.playMusic();
    };
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
    return () => {
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      AudioManager.dispose();
    };
  }, []);

  // block page scroll / pull-to-refresh while playing
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const inGame =
    phase === "playing" || phase === "paused" || phase === "escaping" || phase === "complete";
  // settings opened from the pause menu keeps the scene mounted underneath
  const keepScene = inGame || (phase === "settings" && settingsFrom === "paused");

  const handleGate = (gate: Gate) => {
    if (gate.isReal) {
      playCue("gate-open");
      haptics.success();
      actions.escape(gate.id);
    } else {
      playCue("gate-locked");
      haptics.warning();
      actions.wrongGate(gate.id);
    }
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-background">
      {keepScene ? (
        <Suspense fallback={<LoadingScreen />}>
          <GameScene
            key={`run-${runKey}`}
            level={level}
            paused={phase !== "playing"}
            openGateId={openGateId}
            onGate={handleGate}
            onLeaveGate={() => {
              /* the warning fades on its own timer */
            }}
          />
        </Suspense>
      ) : (
        <MenuBackdrop />
      )}

      {(phase === "playing" || phase === "paused" || phase === "escaping") && <Hud />}
      {phase === "menu" && <MainMenu />}
      {phase === "levels" && <LevelMapScreen />}
      {phase === "settings" && <SettingsScreen />}
      {phase === "daily" && <DailyRewardScreen />}
      {phase === "paused" && <PauseScreen />}
      {phase === "escaping" && <EscapingOverlay />}
      {phase === "complete" && <LevelCompleteScreen />}
    </main>
  );
}
