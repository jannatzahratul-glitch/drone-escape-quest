/**
 * MazeGenerator
 *
 * The maze is a grid of cells: 1 = solid wall block, 0 = walkable floor.
 * A randomised depth-first-search ("recursive backtracker") carves a perfect
 * maze (every open cell reachable, no isolated areas => always solvable).
 * Difficulty parameters shape the result:
 *   - `branching`      how strongly the carver prefers to keep going straight
 *                      (high = long winding corridors, low = bushy branches)
 *   - `deadEndDensity` how many dead ends survive (low = loops, easy to read)
 *   - `routeLength`    how far along the "distance from start" scale the real
 *                      exit is placed
 */

export type Cell = 0 | 1;

export interface Gate {
  /** grid coordinates of the gate opening (on the maze border) */
  x: number;
  y: number;
  /** which border the gate sits on -> used to orient the 3D arch */
  side: "N" | "S" | "E" | "W";
  /** only ONE gate per level is the real exit */
  isReal: boolean;
  id: number;
}

export interface Maze {
  width: number;
  height: number;
  cells: Uint8Array;
  start: { x: number; y: number };
  gates: Gate[];
  /** walk distance from start for every cell (-1 = unreachable) */
  dist: Int32Array;
  /** dead-end cells kept after braiding (used for props / clues) */
  deadEnds: Array<{ x: number; y: number }>;
  /** number of steps along the correct route */
  routeSteps: number;
}

export interface MazeConfig {
  width: number;
  height: number;
  /** 0..1 — fraction of dead ends preserved */
  deadEndDensity: number;
  /** 0..1 — corridor straightness / winding */
  branching: number;
  /** 0..1 — how far the real exit sits along the distance scale */
  routeLength: number;
  /** total gates on the border (exactly one is real) */
  gateCount: number;
  seed: number;
}

/** Deterministic small PRNG so a level always regenerates identically. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const oddAtLeast = (n: number, min: number) => {
  const v = Math.max(min, Math.round(n));
  return v % 2 === 0 ? v + 1 : v;
};

export function generateMaze(config: MazeConfig): Maze {
  const width = oddAtLeast(config.width, 7);
  const height = oddAtLeast(config.height, 7);
  const rand = mulberry32(config.seed);
  const cells = new Uint8Array(width * height).fill(1);
  const idx = (x: number, y: number) => y * width + x;

  // --- 1. carve with randomised DFS, biased by `branching` ----------------
  const startX = 1;
  const startY = 1;
  cells[idx(startX, startY)] = 0;
  const stack: Array<[number, number]> = [[startX, startY]];
  let lastDir: [number, number] | null = null;

  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1]!;
    const dirs: Array<[number, number]> = [
      [0, -2],
      [0, 2],
      [-2, 0],
      [2, 0],
    ];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = dirs[i]!;
      dirs[i] = dirs[j]!;
      dirs[j] = tmp;
    }
    // straightness bias: keep the previous heading first with probability
    // proportional to `branching` -> longer, more confusing corridors
    if (lastDir && rand() < config.branching) {
      const i = dirs.findIndex((d) => d[0] === lastDir![0] && d[1] === lastDir![1]);
      if (i > 0) {
        const d = dirs.splice(i, 1)[0]!;
        dirs.unshift(d);
      }
    }

    let carved = false;
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx <= 0 || ny <= 0 || nx >= width - 1 || ny >= height - 1) continue;
      if (cells[idx(nx, ny)] === 0) continue;
      cells[idx(cx + dx / 2, cy + dy / 2)] = 0;
      cells[idx(nx, ny)] = 0;
      stack.push([nx, ny]);
      lastDir = [dx, dy];
      carved = true;
      break;
    }
    if (!carved) {
      stack.pop();
      lastDir = null;
    }
  }

  // --- 2. braid: remove some dead ends so only `deadEndDensity` survive ---
  const removeChance = 1 - Math.max(0, Math.min(1, config.deadEndDensity));
  if (removeChance > 0) {
    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const neighbours: Array<[number, number]> = [
          [0, -1],
          [0, 1],
          [-1, 0],
          [1, 0],
        ];
        const open = neighbours.filter(([dx, dy]) => cells[idx(x + dx, y + dy)] === 0);
        if (open.length === 1 && rand() < removeChance) {
          const closed = neighbours.filter(
            ([dx, dy]) =>
              cells[idx(x + dx, y + dy)] === 1 &&
              x + dx * 2 > 0 &&
              y + dy * 2 > 0 &&
              x + dx * 2 < width - 1 &&
              y + dy * 2 < height - 1,
          );
          if (closed.length) {
            const [dx, dy] = closed[Math.floor(rand() * closed.length)]!;
            cells[idx(x + dx, y + dy)] = 0;
          }
        }
      }
    }
  }

  const start = { x: 1, y: 1 };

  // --- 3. place gates on the border --------------------------------------
  const candidates: Gate[] = [];
  const push = (x: number, y: number, side: Gate["side"], inX: number, inY: number) => {
    if (cells[idx(inX, inY)] === 0) candidates.push({ x, y, side, isReal: false, id: 0 });
  };
  for (let x = 1; x < width - 1; x += 2) {
    push(x, 0, "N", x, 1);
    push(x, height - 1, "S", x, height - 2);
  }
  for (let y = 1; y < height - 1; y += 2) {
    push(0, y, "W", 1, y);
    push(width - 1, y, "E", width - 2, y);
  }

  const dist = bfs(cells, width, height, start);
  const scored = candidates
    .map((g) => {
      const inX = g.side === "W" ? 1 : g.side === "E" ? width - 2 : g.x;
      const inY = g.side === "N" ? 1 : g.side === "S" ? height - 2 : g.y;
      return { gate: g, d: dist[idx(inX, inY)] ?? -1 };
    })
    .filter((c) => c.d >= 0);

  const chosen: Gate[] = [];
  const minSep = Math.max(4, Math.floor((width + height) / 6));
  for (let i = scored.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = scored[i]!;
    scored[i] = scored[j]!;
    scored[j] = tmp;
  }
  const wanted = Math.max(2, config.gateCount);
  // Anchor the set with a gate whose walking distance matches the requested
  // route length, so the real exit is never a couple of steps from the start.
  const globalMax = Math.max(...scored.map((c) => c.d), 1);
  const targetD = globalMax * Math.max(0.45, Math.min(1, config.routeLength));
  let anchor = scored[0]!;
  for (const c of scored) {
    if (Math.abs(c.d - targetD) < Math.abs(anchor.d - targetD)) anchor = c;
  }
  chosen.push(anchor.gate);
  for (const c of scored) {
    if (chosen.length >= wanted) break;
    if (chosen.every((g) => Math.abs(g.x - c.gate.x) + Math.abs(g.y - c.gate.y) >= minSep)) {
      chosen.push(c.gate);
    }
  }

  for (const c of scored) {
    if (chosen.length >= wanted) break;
    if (!chosen.includes(c.gate)) chosen.push(c.gate);
  }

  // The real exit sits at `routeLength` along the walking-distance scale of
  // the chosen gates, so easy levels get a short route and hard levels a long
  // one. Fakes look identical in-game.
  const withDist = chosen.map((g) => ({
    gate: g,
    d: scored.find((c) => c.gate === g)?.d ?? 0,
  }));
  const maxD = Math.max(...withDist.map((w) => w.d), 1);
  // never place the real exit right next to the start, even on easy levels
  const wantD = maxD * Math.max(0.45, Math.min(1, config.routeLength));
  let realIndex = 0;
  let bestDelta = Infinity;
  withDist.forEach((w, i) => {
    const delta = Math.abs(w.d - wantD);
    if (delta < bestDelta) {
      bestDelta = delta;
      realIndex = i;
    }
  });

  const gates = chosen.map((g, i) => ({ ...g, id: i, isReal: i === realIndex }));
  for (const g of gates) cells[idx(g.x, g.y)] = 0;

  // --- 4. bookkeeping used by props / HUD ---------------------------------
  const deadEnds: Array<{ x: number; y: number }> = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (cells[idx(x, y)] === 1) continue;
      let open = 0;
      if (cells[idx(x + 1, y)] === 0) open++;
      if (cells[idx(x - 1, y)] === 0) open++;
      if (cells[idx(x, y + 1)] === 0) open++;
      if (cells[idx(x, y - 1)] === 0) open++;
      if (open === 1) deadEnds.push({ x, y });
    }
  }

  const finalDist = bfs(cells, width, height, start);
  const real = gates[realIndex]!;
  const routeSteps = Math.max(0, finalDist[idx(real.x, real.y)] ?? 0);

  return { width, height, cells, start, gates, dist: finalDist, deadEnds, routeSteps };
}

/** Breadth-first walk distances from a cell; -1 where unreachable. */
function bfs(cells: Uint8Array, width: number, height: number, from: { x: number; y: number }) {
  const dist = new Int32Array(width * height).fill(-1);
  const idx = (x: number, y: number) => y * width + x;
  const queue = [from];
  dist[idx(from.x, from.y)] = 0;
  while (queue.length) {
    const { x, y } = queue.shift()!;
    const d = dist[idx(x, y)]!;
    const steps: Array<[number, number]> = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ];
    for (const [dx, dy] of steps) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      if (cells[idx(nx, ny)] === 1 || dist[idx(nx, ny)] !== -1) continue;
      dist[idx(nx, ny)] = d + 1;
      queue.push({ x: nx, y: ny });
    }
  }
  return dist;
}

/** World-space helpers: grid <-> world conversion. */
export const CELL_SIZE = 2.4;
export const WALL_HEIGHT = 2.6;

export function cellToWorld(maze: Maze, x: number, y: number): [number, number] {
  return [(x - (maze.width - 1) / 2) * CELL_SIZE, (y - (maze.height - 1) / 2) * CELL_SIZE];
}

export function worldToCell(maze: Maze, wx: number, wz: number) {
  return {
    x: Math.round(wx / CELL_SIZE + (maze.width - 1) / 2),
    y: Math.round(wz / CELL_SIZE + (maze.height - 1) / 2),
  };
}

export function isWall(maze: Maze, x: number, y: number) {
  if (x < 0 || y < 0 || x >= maze.width || y >= maze.height) return true;
  return maze.cells[y * maze.width + x] === 1;
}
