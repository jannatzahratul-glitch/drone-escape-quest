import { Check, Lock } from "lucide-react";
import { getLevelConfig, getLevelLabel, TOTAL_LEVELS } from "@/game/levels/levels";
import { useProgress } from "@/game/save/SaveManager";
import { actions, formatTime } from "@/game/state/gameStore";
import { playCue } from "@/game/audio/AudioManager";
import { MenuButton, Screen } from "./ui";

export function LevelSelectScreen() {
  const unlocked = useProgress((p) => p.unlocked);
  const completed = useProgress((p) => p.completed);
  const bestMs = useProgress((p) => p.bestMs);
  const stars = useProgress((p) => p.stars);
  const xp = useProgress((p) => p.xp);

  const levels = Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1);

  return (
    <Screen dim={62}>
      <div className="animate-in fade-in w-full max-w-md py-4">
        <div className="text-center">
          <h2 className="font-display text-2xl tracking-[0.3em]">LEVELS</h2>
          <p className="mt-2 text-[0.6rem] tracking-[0.35em] text-muted-foreground">
            {completed.length} / {TOTAL_LEVELS} ESCAPED · {xp} XP
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {levels.map((id) => {
            const locked = id > unlocked;
            const done = completed.includes(id);
            const cfg = getLevelConfig(id);
            const best = bestMs[id];
            return (
              <button
                key={id}
                disabled={locked}
                onClick={() => {
                  playCue("ui");
                  actions.startLevel(id);
                }}
                className={`relative rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
                  locked
                    ? "border-border/40 bg-background/20 opacity-55"
                    : "border-border/70 bg-card/50 backdrop-blur-md hover:border-primary/60 hover:bg-card/80"
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="font-display text-lg leading-none">
                    {String(id).padStart(2, "0")}
                  </p>
                  {locked ? (
                    <Lock className="size-4 text-muted-foreground" />
                  ) : done ? (
                    <Check className="size-4 text-primary" />
                  ) : null}
                </div>
                <p className="mt-2 text-[0.55rem] tracking-[0.22em] text-muted-foreground">
                  {getLevelLabel(id)}
                </p>
                <p className="mt-1 truncate text-[0.6rem] tracking-[0.14em] text-foreground/70">
                  {locked ? "LOCKED" : cfg.subtitle}
                </p>
                <p className="mt-2 text-xs tracking-[0.2em] text-primary">
                  {locked ? "\u00a0" : "★★★".slice(0, stars[id] ?? 0) || "\u00a0"}
                </p>
                <p className="mt-1 text-[0.6rem] tabular-nums text-primary">
                  {best !== undefined ? `BEST ${formatTime(best)}` : "\u00a0"}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <MenuButton variant="ghost" onClick={actions.mainMenu}>
            BACK
          </MenuButton>
        </div>
      </div>
    </Screen>
  );
}
