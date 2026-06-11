// src/utils/starCalculator.ts
import type { LevelData } from '../modules/levels/schema';

/**
 * Simple star calculation based on command count.
 * The rules are taken from LevelData.starRules:
 * - oneStar: mustComplete (always true when level finished)
 * - twoStars: maxCommands – earn 2 stars if commandCount <= maxCommands
 * - threeStars: maxCommands – earn 3 stars if commandCount <= maxCommands
 *
 * If the level does not define starRules, default to 1 star.
 */
export function calculateStars(levelId: number, commandCount: number, levels?: LevelData[]): number {
  if (!levels) return 1;
  const level = levels.find((l) => Number(l.id) === levelId);
  if (!level || !level.starRules) return 1;

  const { oneStar, twoStars, threeStars } = level.starRules;
  // oneStar.mustComplete is assumed true when we call this function.
  if (commandCount <= (threeStars?.maxCommands ?? Infinity)) return 3;
  if (commandCount <= (twoStars?.maxCommands ?? Infinity)) return 2;
  return 1;
}
