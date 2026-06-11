// src/modules/progress/summary.ts
export interface ProgressSummary {
  totalLevels: number;
  completedLevels: number;
  totalStars: number;
  recentCompletions: number;
  completionPercentage: number;
}

export class Summary {
  static calculate({
    totalLevels,
    completedLevels,
    totalStars,
    recentCompletions,
  }: {
    totalLevels: number;
    completedLevels: number;
    totalStars: number;
    recentCompletions: number;
  }): ProgressSummary {
    return {
      totalLevels,
      completedLevels,
      totalStars,
      recentCompletions,
      completionPercentage: totalLevels > 0 ? (completedLevels / totalLevels) * 100 : 0,
    };
  }
}