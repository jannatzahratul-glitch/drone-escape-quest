import { actions, formatTime, useGame } from "@/game/state/gameStore";

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-in fade-in zoom-in-95 w-full max-w-sm rounded-3xl border border-border/60 bg-card/70 p-8 text-center shadow-2xl backdrop-blur-xl duration-300">
      {children}
    </div>
  );
}

function MenuButton({
  children,
  onClick,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "ghost";
}) {
  const base =
    "w-full rounded-2xl px-6 py-3.5 font-display text-sm tracking-[0.2em] transition-all active:scale-[0.98]";
  const styles =
    variant === "primary"
      ? "bg-primary text-primary-foreground shadow-[0_0_28px_-6px_var(--primary)] hover:brightness-110"
      : "border border-border/70 bg-background/30 text-foreground hover:bg-background/60";
  return (
    <button onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

export function StartScreen() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/45 p-6 backdrop-blur-[6px]">
      <Panel>
        <h1 className="font-display text-4xl tracking-[0.28em] text-foreground">MAZE ESCAPE</h1>
        <p className="mt-3 text-xs tracking-[0.35em] text-primary">THE ONE WAY OUT</p>
        <div className="mt-8">
          <MenuButton onClick={() => actions.startLevel(1)}>PLAY</MenuButton>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Find the only way out.</p>
      </Panel>
    </div>
  );
}

export function PauseScreen() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/55 p-6 backdrop-blur-md">
      <Panel>
        <h2 className="font-display text-2xl tracking-[0.3em]">PAUSED</h2>
        <div className="mt-8 space-y-3">
          <MenuButton onClick={actions.resume}>RESUME</MenuButton>
          <MenuButton variant="ghost" onClick={actions.restart}>
            RESTART LEVEL
          </MenuButton>
          <MenuButton variant="ghost" onClick={actions.mainMenu}>
            MAIN MENU
          </MenuButton>
        </div>
      </Panel>
    </div>
  );
}

export function LevelCompleteScreen() {
  const finalMs = useGame((s) => s.finalMs);
  const level = useGame((s) => s.level);
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/50 p-6 backdrop-blur-md">
      <Panel>
        <div className="mx-auto mb-6 size-16 animate-pulse rounded-full bg-primary/25 ring-4 ring-primary/40" />
        <h2 className="font-display text-2xl tracking-[0.28em] text-primary">LEVEL COMPLETE</h2>
        <p className="mt-2 text-xs tracking-[0.3em] text-muted-foreground">
          LEVEL {String(level).padStart(2, "0")}
        </p>
        <p className="mt-6 font-display text-4xl tabular-nums">{formatTime(finalMs)}</p>
        <p className="text-[0.6rem] tracking-[0.3em] text-muted-foreground">TIME</p>
        <div className="mt-8 space-y-3">
          <MenuButton onClick={actions.nextLevel}>NEXT LEVEL</MenuButton>
          <MenuButton variant="ghost" onClick={actions.mainMenu}>
            MAIN MENU
          </MenuButton>
        </div>
      </Panel>
    </div>
  );
}
