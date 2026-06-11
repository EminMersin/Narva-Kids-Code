import { describe, expect, test } from 'vitest';
import { isWebLevel, LevelSchema } from '../../modules/levels/schema';
import { GameEngine } from '../../modules/game/engine';
import { compileCode } from '../../modules/interpreter';
import { levelRegistry, getNextLevelId } from '../../modules/levels/registry';
import { renderWebPreview, validateWebLevel } from '../../modules/web/engine';

describe('Level Validation', () => {
  test('Registry contains 120 Python and curated Web unique playable levels', () => {
    expect(levelRegistry).toHaveLength(141);
    expect(levelRegistry.filter((entry) => entry.track === 'python')).toHaveLength(120);
    expect(levelRegistry.filter((entry) => entry.track === 'web')).toHaveLength(21);
    expect(new Set(levelRegistry.map((entry) => entry.id)).size).toBe(141);
    expect(levelRegistry.slice(0, 8).map((entry) => entry.id)).toEqual([
      'movement_easy_001',
      'movement_easy_002',
      'movement_easy_003',
      'movement_easy_004',
      'movement_easy_005',
      'movement_easy_006',
      'movement_easy_007',
      'movement_easy_008',
    ]);
  });

  test('All registry levels conform to schema and star rules', () => {
    levelRegistry.forEach(({ levelData: level }) => {
      const parsed = LevelSchema.safeParse(level);
      expect(parsed, `${level.id}: ${parsed.success ? '' : parsed.error.issues.join(', ')}`).toMatchObject({ success: true });
      expect(level.starRules.threeStars.maxCommands).toBeLessThanOrEqual(level.starRules.twoStars.maxCommands);
      expect(level.id).toMatch(new RegExp(`^${level.world}_${level.mode}_\\d{3}$`));
    });
  });

  test('Example solutions compile and complete each level', async () => {
    for (const { levelData: level } of levelRegistry) {
      if (isWebLevel(level)) {
        const result = validateWebLevel(level, level.solution.document);
        const preview = renderWebPreview(level.solution.document);

        expect(result.completed, `${level.id}: ${result.errors.join(', ')}`).toBe(true);
        expect(preview, `${level.id} preview should not be empty`).toContain('<html>');
        continue;
      }

      const engine = new GameEngine(level);
      const compiled = compileCode(level.solution.pythonCode, level.availableCommands);

      expect(compiled).toMatchObject({ success: true });
      const commands = compiled.success ? compiled.commands : [];

      for (const command of commands) {
        await expect(engine.execute(command), `${level.id} failed command ${command}`).resolves.toBe(true);
      }

      expect(engine.checkGoal(), `${level.id} did not reach its goal`).toBe(true);
    }
  });

  test('Registry exposes a global next-level order', () => {
    expect(getNextLevelId(levelRegistry[0].id)).toBe(levelRegistry[1].id);
    expect(getNextLevelId(levelRegistry.filter((entry) => entry.track === 'python').at(-1)!.id)).toBeNull();
    expect(getNextLevelId(levelRegistry.filter((entry) => entry.track === 'web').at(-1)!.id)).toBeNull();
  });

  test('Rejects unavailable repeat and condition commands', () => {
    const repeat = compileCode('repeat(3): move_right', ['move_right']);
    const condition = compileCode('if obstacle_ahead(): move_up', ['move_up']);

    expect(repeat.success).toBe(false);
    expect(condition.success).toBe(false);
  });

  test('movement_easy_005 repeat route completes with repeat count variable', async () => {
    const level = levelRegistry.find((entry) => entry.id === 'movement_easy_005')!.levelData;
    if (isWebLevel(level)) throw new Error('movement_easy_005 should be a robot level');

    const compiled = compileCode('move_up(2)\nsteps = 1 * 5\nrepeat(steps): move_right()\nmove_down()', [
      'move_up',
      'move_right',
      'move_down',
      'repeat',
      'assignment',
      'operator',
    ]);

    expect(compiled).toMatchObject({ success: true });
    const engine = new GameEngine(level);
    for (const command of compiled.success ? compiled.commands : []) {
      await expect(engine.execute(command), `failed command ${command}`).resolves.toBe(true);
    }
    expect(engine.checkGoal()).toBe(true);
  });
});
