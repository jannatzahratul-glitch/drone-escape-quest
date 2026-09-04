/**
 * ClueSystem
 *
 * Clues are DATA generated deterministically from the maze + level config.
 * They are placed in the 3D world as carved stones and, taken together, they
 * always identify exactly ONE gate — the real exit. The player never has to
 * guess: every level is validated before it starts (see buildLevel).
 */
import type { Gate, Maze } from "../maze/generator";

export type SymbolId = "moon" | "sun" | "star" | "eye" | "serpent" | "key";

export const SYMBOLS: Record<SymbolId, { label: string; glyph: string }> = {
  moon: { label: "MOON", glyph: "☾" },
  sun: { label: "SUN", glyph: "✸" },
  star: { label: "STAR", glyph: "✦" },
  eye: { label: "EYE", glyph: "◉" },
  serpent: { label: "SERPENT", glyph: "§" },
  key: { label: "KEY", glyph: "⚿" },
};

const SYMBOL_ORDER: SymbolId[] = ["moon", "sun", "star", "eye", "serpent", "key"];

export const SIDE_NAME: Record<Gate["side"], string> = {
  N: "NORTH",
  S: "SOUTH",
  E: "EAST",
  W: "WEST",
};

export type ClueKind = "symbol" | "direction" | "elimination" | "lore";

export interface Clue {
  id: number;
  /** grid cell the carved stone stands in */
  cell: { x: number; y: number };
  kind: ClueKind;
  title: string;
  /** the sentence shown on discovery and in the notebook */
  text: string;
  symbol: SymbolId;
  xp: number;
}

/** Constraint a clue puts on the set of possible gates. */
type Constraint = (gate: GateInfo) => boolean;

export interface GateInfo extends Gate {
  symbol: SymbolId;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Give every gate a distinct carved symbol (fakes look exactly as important). */
export function assignGateSymbols(maze: Maze, seed: number): GateInfo[] {
  const rand = rng(seed);
  const pool = [...SYMBOL_ORDER];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = t;
  }
  return maze.gates.map((g, i) => ({ ...g, symbol: pool[i % pool.length]! }));
}

export interface CluePlan {
  /** how many clue stones to place */
  count: number;
  /** how directly the clues speak */
  style: "obvious" | "simple" | "combo" | "subtle";
}

/**
 * Build the clue set for a level. Always returns a set that narrows the gates
 * down to the single real exit (validated by `solves`).
 */
export function buildClues(
  maze: Maze,
  gates: GateInfo[],
  plan: CluePlan,
  seed: number,
): Clue[] {
  const rand = rng(seed + 999);
  const real = gates.find((g) => g.isReal)!;
  const fakes = gates.filter((g) => !g.isReal);

  interface Draft {
    kind: ClueKind;
    title: string;
    text: string;
    symbol: SymbolId;
    constraint: Constraint;
  }

  const symbolClue: Draft = {
    kind: "symbol",
    title: "The Marked Gate",
    text: `The way out bears the mark of the ${SYMBOLS[real.symbol].label}.`,
    symbol: real.symbol,
    constraint: (g) => g.symbol === real.symbol,
  };

  const directionClue: Draft = {
    kind: "direction",
    title: "The Old Direction",
    text: `The open sky lies to the ${SIDE_NAME[real.side]}.`,
    symbol: "star",
    constraint: (g) => g.side === real.side,
  };

  const eliminations: Draft[] = fakes
    .filter((f) => f.side !== real.side)
    .map((f) => ({
      kind: "elimination" as ClueKind,
      title: "A Sealed Way",
      text: `Nothing but stone waits beyond the ${SIDE_NAME[f.side]} gate.`,
      symbol: "serpent" as SymbolId,
      constraint: (g: GateInfo) => g.side !== f.side,
    }));

  const symbolEliminations: Draft[] = fakes.map((f) => ({
    kind: "elimination" as ClueKind,
    title: "A False Mark",
    text: `The ${SYMBOLS[f.symbol].label} was carved by those who never left.`,
    symbol: f.symbol,
    constraint: (g: GateInfo) => g.symbol !== f.symbol,
  }));

  const lore: Draft[] = [
    {
      kind: "lore",
      title: "Wanderer's Note",
      text: "Every gate looks alike. Only the marks tell them apart.",
      symbol: "eye",
      constraint: () => true,
    },
    {
      kind: "lore",
      title: "Old Warning",
      text: "Dead ends keep their own secrets. Look for what is carved.",
      symbol: "eye",
      constraint: () => true,
    },
  ];

  let drafts: Draft[] = [];
  switch (plan.style) {
    case "obvious":
      drafts = [symbolClue, directionClue];
      break;
    case "simple":
      drafts = [symbolClue, ...lore];
      break;
    case "combo":
      drafts = [directionClue, symbolClue, ...symbolEliminations];
      break;
    case "subtle":
      drafts = [...eliminations, ...symbolEliminations, directionClue, ...lore];
      break;
  }

  // take the requested number, then guarantee solvability by clue alone
  let chosen = drafts.slice(0, Math.max(1, plan.count));
  if (!solves(chosen.map((d) => d.constraint), gates)) {
    for (const d of [...symbolEliminations, directionClue, symbolClue]) {
      if (chosen.length >= plan.count + 2) break;
      chosen.push(d);
      if (solves(chosen.map((c) => c.constraint), gates)) break;
    }
  }
  if (!solves(chosen.map((d) => d.constraint), gates)) chosen = [symbolClue, ...chosen];

  const cells = pickClueCells(maze, chosen.length, rand);
  return chosen.slice(0, cells.length).map((d, i) => ({
    id: i,
    cell: cells[i]!,
    kind: d.kind,
    title: d.title,
    text: d.text,
    symbol: d.symbol,
    xp: 10,
  }));
}

/** Do these constraints leave exactly one gate standing? */
function solves(constraints: Constraint[], gates: GateInfo[]) {
  const left = gates.filter((g) => constraints.every((c) => c(g)));
  return left.length === 1 && left[0]!.isReal;
}

/**
 * Place clue stones on reachable cells, spread across the maze and biased
 * toward dead ends / junctions so exploring is rewarded.
 */
function pickClueCells(maze: Maze, count: number, rand: () => number) {
  const idx = (x: number, y: number) => y * maze.width + x;
  const candidates = [...maze.deadEnds]
    .filter((c) => (maze.dist[idx(c.x, c.y)] ?? -1) > 2)
    .sort((a, b) => (maze.dist[idx(b.x, b.y)] ?? 0) - (maze.dist[idx(a.x, a.y)] ?? 0));

  if (candidates.length < count) {
    for (let y = 1; y < maze.height - 1 && candidates.length < count * 3; y++) {
      for (let x = 1; x < maze.width - 1; x++) {
        const d = maze.dist[idx(x, y)] ?? -1;
        if (d > 3 && maze.cells[idx(x, y)] === 0) candidates.push({ x, y });
      }
    }
  }

  const picked: Array<{ x: number; y: number }> = [];
  const minSep = Math.max(3, Math.floor((maze.width + maze.height) / 8));
  for (const c of candidates) {
    if (picked.length >= count) break;
    if (picked.every((p) => Math.abs(p.x - c.x) + Math.abs(p.y - c.y) >= minSep)) picked.push(c);
  }
  for (const c of candidates) {
    if (picked.length >= count) break;
    if (!picked.includes(c)) picked.push(c);
  }
  // deterministic shuffle so clue order isn't always "farthest first"
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const t = picked[i]!;
    picked[i] = picked[j]!;
    picked[j] = t;
  }
  return picked;
}
