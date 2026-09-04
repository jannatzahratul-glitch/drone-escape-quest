/**
 * HintManager — contextual nudges. A hint never names the correct gate;
 * it points the player at information they have not used yet.
 */
import { buildLevel } from "../levels/levelBuilder";
import { SIDE_NAME } from "../clues/clueSystem";

export interface HintContext {
  level: number;
  discoveredClueIds: number[];
  wrongGates: number;
  playerCell: { x: number; y: number } | null;
  visitedGates: number[];
}

const COMPASS = (dx: number, dy: number) => {
  const ns = dy < 0 ? "north" : dy > 0 ? "south" : "";
  const ew = dx > 0 ? "east" : dx < 0 ? "west" : "";
  return [ns, ew].filter(Boolean).join("-") || "nearby";
};

export function nextHint(ctx: HintContext): string {
  const build = buildLevel(ctx.level);
  const undiscovered = build.clues.filter((c) => !ctx.discoveredClueIds.includes(c.id));

  if (undiscovered.length > 0) {
    if (ctx.playerCell) {
      const nearest = undiscovered.reduce((best, c) => {
        const d = (x: { cell: { x: number; y: number } }) =>
          Math.abs(x.cell.x - ctx.playerCell!.x) + Math.abs(x.cell.y - ctx.playerCell!.y);
        return d(c) < d(best) ? c : best;
      });
      const dir = COMPASS(nearest.cell.x - ctx.playerCell.x, nearest.cell.y - ctx.playerCell.y);
      return `Something is carved into the stone to the ${dir}. Go and read it.`;
    }
    return "Markings are carved somewhere in these halls. Explore before choosing a gate.";
  }

  if (ctx.discoveredClueIds.length > 0 && ctx.visitedGates.length === 0) {
    return "You have read the marks. Compare them with the symbol above each gate.";
  }

  if (ctx.wrongGates > 0) {
    const real = build.gates.find((g) => g.isReal)!;
    const fakesLeft = build.gates.filter(
      (g) => !g.isReal && !ctx.visitedGates.includes(g.id),
    ).length;
    if (fakesLeft > 0) return "That gate was sealed. The marks favour another side of the maze.";
    return `Only one wall still holds an unopened gate — look ${SIDE_NAME[real.side].toLowerCase()}.`;
  }

  return "Read your notebook again — together the marks name exactly one gate.";
}
