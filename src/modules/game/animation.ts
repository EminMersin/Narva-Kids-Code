// src/modules/game/animation.ts
export class Animation {
  /** Animate a character move */
  async move(dx: number, dy: number, durationMs: number = 200): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, durationMs));
  }

  /** Animate a turn */
  async turn(direction: string, durationMs: number = 100): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, durationMs));
  }

  /** Item pickup sparkle */
  async pickItem(durationMs: number = 300): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, durationMs));
  }
}