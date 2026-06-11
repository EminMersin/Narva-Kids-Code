import { LevelLoading } from './loader';
import { SchemaValidator, type ValidationResult } from './validator';
import { ExampleRunner, type ExampleResult } from './tests';
import type { LevelData } from './schema';

export class Levels {
  private loading = new LevelLoading();
  private validator = new SchemaValidator();
  private testing = new ExampleRunner();

  loadLevels(levelsPath: string): Record<string, LevelData> {
    try {
      const levels = this.loading.load(levelsPath);

      for (const [id, level] of Object.entries(levels)) {
        const validation = this.validator.validate(level);
        if (!validation.valid) {
          console.error(`[Levels] Invalid level ${id}:`, validation.errors);
        }
      }

      return levels as Record<string, LevelData>;
    } catch (error) {
      console.error('[Levels] Failed to load levels:', error);
      return {};
    }
  }

  getLevel(levelId: string, levels: Record<string, LevelData>): LevelData | null {
    return levels[levelId] || null;
  }

  validateLevel(level: LevelData): ValidationResult {
    return this.validator.validate(level);
  }

  runExample(levelId: string, code: string): ExampleResult {
    return this.testing.execute(levelId, code);
  }
}

export type { LevelData, ValidationResult, ExampleResult };
