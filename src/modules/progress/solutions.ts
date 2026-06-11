// src/modules/progress/solutions.ts
export interface Solution {
  levelId: string;
  code: string;
  timestamp: string;
  commandsUsed: number;
  stars: number;
}

export class Solutions {
  private solutions: Solution[] = [];

  addSolution(solution: Solution): void {
    this.solutions.push(solution);
  }

  getSolutions(): Solution[] {
    return [...this.solutions];
  }

  getBestSolution(levelId: string): Solution | null {
    return this.solutions
      .filter((s) => s.levelId === levelId)
      .sort((a, b) => b.stars - a.stars)[0] || null;
  }
}