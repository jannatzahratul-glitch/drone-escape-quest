import { getLevelConfig, getLevelLabel } from "@/game/levels/levels";
import { bestTime, useProgress } from "@/game/save/SaveManager";
import { actions, formatTime, useGame } from "@/game/state/gameStore";
import { MenuButton, Panel, Screen } from "./ui";

export function StartScreen() {
  const unlocked = useProgress((p) => p.unlocked);
  return (
    <Screen dim={38}>
      <Panel>
        <p className="text-[0.6rem] tracking-[0.5em] text-muted-foreground">A LABYRINTH GAME</p>
        <h1 className="mt-3 font-display text-4xl tracking-[0.24em] text-foreground">
          MAZE ESCAPE
        </h1>
        <p className="mt-3 text-xs tracking-[0.35em] text-primary">THE ONE WAY OUT</p>
        <div className="mx-auto mt-6 h-px w-24 bg-border" />
        <div className="mt-7 space-y-3">
          <MenuButton onClick={() => actions.startLevel(Math.max(1, unlocked))}>PLAY</MenuButton>
          <MenuButton variant="ghost" onClick={actions.showLevels}>
            LEVELS
          </MenuButton>
          <MenuButton variant="ghost" onClick={actions.showSettings}>
            SETTINGS
          </MenuButton>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Every gate looks the same. Only one opens.
        </p>
      </Panel>
    </Screen>
  );
}

export function PauseScreen() {
  const level = useGame((s) => s.level);
  return (
    <Screen dim={55}>
      <Panel>
        <h2 className="font-display text-2xl tracking-[0.3em]">PAUSED</h2>
        <p className="mt-2 text-[0.65rem] tracking-[0.35em] text-muted-foreground">
          {getLevelConfig(level).name} · {getLevelLabel(level)}
        </p>
        <div className="mt-8 space-y-3">
          <MenuButton onClick={actions.resume}>RESUME</MenuButton>
          <MenuButton variant="ghost" onClick={actions.restart}>
            RESTART LEVEL
          </MenuButton>
          <MenuButton variant="ghost" onClick={actions.showLevels}>
            LEVEL SELECT
          </MenuButton>
          <MenuButton variant="ghost" onClick={actions.mainMenu}>
            MAIN MENU
          </MenuButton>
        </div>
      </Panel>
    </Screen>
  );
}

export function LevelCompleteScreen() {
  const finalMs = useGame((s) => s.finalMs);
  const level = useGame((s) => s.level);
  const isNewBest = useGame((s) => s.isNewBest);
  useProgress((p) => p.bestMs[level]);
  const best = bestTime(level) ?? finalMs;

  return (
    <Screen dim={50}>
      <Panel>
        <div className="mx-auto mb-6 size-16 animate-pulse rounded-full bg-primary/25 ring-4 ring-primary/40" />
        <h2 className="font-display text-2xl tracking-[0.26em] text-primary">LEVEL COMPLETE</h2>
        <p className="mt-2 text-[0.6rem] tracking-[0.3em] text-muted-foreground">
          {getLevelConfig(level).name} · {getLevelConfig(level).subtitle}
        </p>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/50 bg-background/30 py-4">
            <p className="text-[0.55rem] tracking-[0.3em] text-muted-foreground">TIME</p>
            <p className="font-display text-2xl tabular-nums">{formatTime(finalMs)}</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/30 py-4">
            <p className="text-[0.55rem] tracking-[0.3em] text-muted-foreground">BEST TIME</p>
            <p className="font-display text-2xl tabular-nums text-primary">{formatTime(best)}</p>
          </div>
        </div>
        {isNewBest && (
          <p className="mt-3 text-[0.6rem] tracking-[0.3em] text-primary">NEW RECORD</p>
        )}

        <div className="mt-7 space-y-3">
          <MenuButton onClick={actions.nextLevel}>NEXT LEVEL</MenuButton>
          <MenuButton variant="ghost" onClick={actions.showLevels}>
            LEVEL SELECT
          </MenuButton>
          <MenuButton variant="ghost" onClick={actions.mainMenu}>
            MAIN MENU
          </MenuButton>
        </div>
      </Panel>
    </Screen>
  );
}

/** Short cinematic beat while the real gate swings open. */
export function EscapingOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-24">
      <p className="animate-in fade-in slide-in-from-bottom-4 rounded-full border border-primary/40 bg-card/70 px-6 py-2 font-display text-sm tracking-[0.3em] text-primary backdrop-blur-md">
        THE GATE OPENS
      </p>
    </div>
  );
}
