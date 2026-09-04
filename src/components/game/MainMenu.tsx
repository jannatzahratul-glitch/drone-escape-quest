import { Gift, Map, Play, Settings2, RotateCw } from "lucide-react";
import { useProgress } from "@/game/save/SaveManager";
import { actions, formatTime, getElapsedMs, useGame } from "@/game/state/gameStore";
import { getLevelConfig } from "@/game/levels/levels";
import { AudioManager } from "@/game/audio/AudioManager";
import { haptics } from "@/game/haptics/HapticManager";
import { CoinChip, XpBar } from "./economy/Wallet";
import { MenuButton, Panel, Screen } from "./ui";

/**
 * Premium main menu: title, player profile (existing economy), and the
 * primary navigation. CONTINUE appears only when a run is safely resumable.
 */
export function MainMenu() {
  const unlocked = useProgress((p) => p.unlocked);
  const suspended = useGame((s) => s.suspended);
  const runKey = useGame((s) => s.runKey);
  const accumulatedMs = useGame((s) => s.accumulatedMs);
  const resumable = !!suspended && suspended.runKey === runKey;

  const go = (fn: () => void) => () => {
    AudioManager.unlock();
    haptics.light();
    fn();
  };

  return (
    <Screen dim={30}>
      <Panel>
        <p className="text-[0.6rem] tracking-[0.5em] text-muted-foreground">A LABYRINTH GAME</p>
        <h1 className="mt-3 font-display text-4xl tracking-[0.24em] text-foreground drop-shadow-[0_0_28px_color-mix(in_oklab,var(--primary)_45%,transparent)]">
          MAZE ESCAPE
        </h1>
        <p className="mt-3 text-[0.65rem] tracking-[0.38em] text-primary">FIND THE ONE WAY OUT</p>
        <div className="mx-auto mt-6 h-px w-24 bg-border" />

        {/* player profile — uses the existing economy/XP system */}
        <div className="mt-6 space-y-3 rounded-2xl border border-border/50 bg-background/30 p-4">
          <XpBar />
          <div className="flex justify-center">
            <CoinChip compact />
          </div>
        </div>

        <div className="mt-7 space-y-3">
          {resumable ? (
            <>
              <MenuButton onClick={go(actions.continueRun)}>
                <span className="flex items-center justify-center gap-2">
                  <RotateCw className="size-4" /> CONTINUE
                </span>
              </MenuButton>
              <p className="text-[0.55rem] tracking-[0.28em] text-muted-foreground">
                {getLevelConfig(suspended.level).name} · {formatTime(accumulatedMs || getElapsedMs())}
              </p>
            </>
          ) : (
            <MenuButton onClick={go(() => actions.startLevel(Math.max(1, unlocked)))}>
              <span className="flex items-center justify-center gap-2">
                <Play className="size-4" /> PLAY
              </span>
            </MenuButton>
          )}

          <MenuButton variant="ghost" onClick={go(actions.showLevels)}>
            <span className="flex items-center justify-center gap-2">
              <Map className="size-4" /> LEVELS
            </span>
          </MenuButton>
          <MenuButton variant="ghost" onClick={go(actions.showDaily)}>
            <span className="flex items-center justify-center gap-2">
              <Gift className="size-4 text-[#e0bd6b]" /> DAILY REWARD
            </span>
          </MenuButton>
          <MenuButton variant="ghost" onClick={go(() => actions.showSettings("menu"))}>
            <span className="flex items-center justify-center gap-2">
              <Settings2 className="size-4" /> SETTINGS
            </span>
          </MenuButton>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Every gate looks the same. Only one opens.
        </p>
      </Panel>
    </Screen>
  );
}
