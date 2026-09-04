import { TOTAL_LEVELS } from "../levels/levels";
import { getProgress } from "../save/SaveManager";

/**
 * ChapterManager — levels grouped into chapters (worlds).
 *
 * Chapters are pure DATA so future worlds only need a new entry here.
 * Only chapters with `active: true` are playable; the rest render as
 * mysterious "COMING SOON" areas on the level map.
 */
export interface Chapter {
  id: number;
  name: string;
  subtitle: string;
  from: number;
  to: number;
  active: boolean;
}

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    name: "THE FORGOTTEN MAZE",
    subtitle: "Where the first walls were raised",
    from: 1,
    to: TOTAL_LEVELS,
    active: true,
  },
  { id: 2, name: "THE LOST FORTRESS", subtitle: "Locked", from: 11, to: 20, active: false },
  { id: 3, name: "THE DARK CATACOMBS", subtitle: "Locked", from: 21, to: 30, active: false },
  { id: 4, name: "THE ANCIENT RUINS", subtitle: "Locked", from: 31, to: 40, active: false },
];

export const activeChapters = () => CHAPTERS.filter((c) => c.active);

export const chapterLevels = (c: Chapter) =>
  Array.from({ length: c.to - c.from + 1 }, (_, i) => c.from + i);

export const chapterOf = (level: number) =>
  CHAPTERS.find((c) => level >= c.from && level <= c.to) ?? CHAPTERS[0]!;

export interface ChapterProgress {
  completed: number;
  total: number;
  stars: number;
  maxStars: number;
  percent: number;
  finished: boolean;
}

export function chapterProgress(c: Chapter): ChapterProgress {
  const p = getProgress();
  const levels = chapterLevels(c);
  const completed = levels.filter((id) => p.completed.includes(id)).length;
  const stars = levels.reduce((sum, id) => sum + (p.stars[id] ?? 0), 0);
  const total = levels.length;
  return {
    completed,
    total,
    stars,
    maxStars: total * 3,
    percent: Math.round((completed / total) * 100),
    finished: completed === total,
  };
}

/** Is the chapter finale (last level of its chapter). */
export const isFinale = (level: number) => chapterOf(level).to === level;
