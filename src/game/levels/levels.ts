import type { MazeConfig } from "../maze/generator";

/**
 * Level architecture.
 *
 * Levels are DATA, not code: each entry is a set of difficulty parameters fed
 * to the procedural maze generator. Adding 100+ levels later means extending
 * this table (or generating it), not touching gameplay code.
 *
 * Difficulty deliberately follows a rhythm rather than a straight ramp:
 * hard -> easy -> medium -> hard -> easy -> very hard ...
 */
export interface LevelConfig {
  id: number;
  name: string;
  maze: MazeConfig;
  /** 1..5, used for HUD / future star ratings */
  difficulty: number;
}

interface LevelSpec {
  width: number;
  height: number;
  braid: number;
  gates: number;
  difficulty: number;
}

/** Authored specs. Anything beyond this list is generated procedurally. */
const SPECS: LevelSpec[] = [
  // Level 1 — small/medium but genuinely challenging, 2 gates (1 fake).
  { width: 15, height: 15, braid: 0.15, gates: 2, difficulty: 3 },
];

/** Rhythm multipliers applied to procedurally extended levels. */
const RHYTHM = [1.0, 0.75, 0.9, 1.15, 0.7, 1.3];

export function getLevelConfig(id: number): LevelConfig {
  const authored = SPECS[id - 1];
  if (authored) {
    return {
      id,
      name: `Level ${id}`,
      difficulty: authored.difficulty,
      maze: {
        width: authored.width,
        height: authored.height,
        braid: authored.braid,
        gateCount: authored.gates,
        seed: id * 7919 + 13,
      },
    };
  }

  // Procedural extension: size grows slowly, modulated by the rhythm curve.
  const step = id - SPECS.length;
  const rhythm = RHYTHM[step % RHYTHM.length] ?? 1;
  const base = 15 + Math.floor(step / 2) * 2;
  const size = Math.min(35, Math.max(11, Math.round(base * rhythm)));
  const gates = Math.min(6, 2 + Math.floor(step / 2));
  return {
    id,
    name: `Level ${id}`,
    difficulty: Math.min(5, Math.max(1, Math.round(rhythm * 3.5))),
    maze: {
      width: size,
      height: size,
      braid: 0.1 + (rhythm - 0.7) * 0.2,
      gateCount: gates,
      seed: id * 7919 + 13,
    },
  };
}

export const MAX_AUTHORED_LEVEL = SPECS.length;
