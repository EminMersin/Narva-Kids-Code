import { GameEngine } from './engine';
import { compileCode } from '@/modules/interpreter';
import type { RobotLevelData } from '@/modules/levels/schema';

export class GameDemo {
  private engine: GameEngine;

  constructor(levelData: RobotLevelData) {
    this.engine = new GameEngine(levelData);
  }

  async execute(userCode: string): Promise<{ success: boolean; error?: string }> {
    try {
      const compiled = compileCode(userCode);

      if (!compiled.success) {
        return { success: false, error: compiled.error };
      }

      for (const command of compiled.commands) {
        const ok = await this.engine.execute(command);
        if (!ok) return { success: false, error: `Command failed: ${command}` };
      }

      return { success: this.engine.checkGoal() };
    } catch (error) {
      return {
        success: false,
        error: `Runtime error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
