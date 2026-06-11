// src/modules/progress/unlocks.ts
export class Unlocks {
  private unlocked: Record<string, boolean> = {};

  constructor(initial: Record<string, boolean> = {}) {
    this.unlocked = { ...initial };
  }

  isUnlocked(key: string): boolean {
    return !!this.unlocked[key];
  }

  unlock(key: string): void {
    this.unlocked[key] = true;
  }

  getUnlocked(): Record<string, boolean> {
    return { ...this.unlocked };
  }
}