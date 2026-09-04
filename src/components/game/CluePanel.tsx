import { X } from "lucide-react";
import { SYMBOLS } from "@/game/clues/clueSystem";
import { buildLevel } from "@/game/levels/levelBuilder";
import { actions, useGame } from "@/game/state/gameStore";

/** The clue notebook: only what the player has actually found. */
export function CluePanel() {
  const level = useGame((s) => s.level);
  const discovered = useGame((s) => s.discoveredClueIds);
  const clues = buildLevel(level).clues;
  const found = clues.filter((c) => discovered.includes(c.id));

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-end justify-center bg-background/50 p-4 backdrop-blur-[6px] sm:items-center">
      <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-sm rounded-3xl border border-border/60 bg-card/85 p-6 shadow-2xl backdrop-blur-xl duration-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.55rem] tracking-[0.35em] text-muted-foreground">NOTEBOOK</p>
            <h3 className="font-display text-xl tracking-[0.2em]">CLUES</h3>
          </div>
          <button
            onClick={actions.toggleCluePanel}
            aria-label="Close clues"
            className="flex size-10 items-center justify-center rounded-xl border border-border/60 bg-background/40 text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-3 text-[0.6rem] tracking-[0.25em] text-muted-foreground">
          {found.length} / {clues.length} DISCOVERED
        </p>

        <ul className="mt-4 space-y-3">
          {clues.map((c, i) => {
            const known = discovered.includes(c.id);
            return (
              <li
                key={c.id}
                className={`flex gap-3 rounded-2xl border p-3 text-left ${
                  known ? "border-border/60 bg-background/40" : "border-border/30 bg-background/15"
                }`}
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-lg ${
                    known ? "bg-primary/20 text-primary" : "bg-muted/20 text-muted-foreground"
                  }`}
                >
                  {known ? SYMBOLS[c.symbol].glyph : "?"}
                </span>
                <div>
                  <p className="text-[0.6rem] tracking-[0.25em] text-muted-foreground">
                    {String(i + 1).padStart(2, "0")} · {known ? c.title : "UNDISCOVERED"}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-foreground">
                    {known ? c.text : "Somewhere in the maze, still unread."}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-5 text-xs text-muted-foreground">
          Compare the marks with the symbol carved above each gate.
        </p>
      </div>
    </div>
  );
}
