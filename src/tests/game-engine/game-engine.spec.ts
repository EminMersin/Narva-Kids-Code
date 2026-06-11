// src/tests/game-engine/game-engine.spec.ts
import { GameEngine } from '../../modules/game/engine';
import { describe, expect, test, beforeEach } from 'vitest';

describe('GameEngine', () => {
  let engine: GameEngine;
  const mockLevel = {
    id: 'test_level',
    world: 'movement',
    mode: 'easy' as const,
    order: 1,
    title: 'Test Level',
    learningOutcome: 'Test movement',
    childIntro: 'Test',
    topicTags: ['movement'],
    grid: { rows: 5, cols: 5 },
    player: { x: 1, y: 1, direction: 'right' as const },
    goal: { x: 4, y: 1, type: 'door' },
    items: [],
    obstacles: [],
    availableCommands: ['move_forward', 'turn_left', 'turn_right'],
    availableBlocks: ['move_forward', 'turn_left', 'turn_right'],
    successRules: {
      mustReachGoal: true,
      mustCollectItems: [],
      requiredCommands: [],
      forbiddenCommands: [],
    },
    starRules: {
      oneStar: { mustComplete: true },
      twoStars: { maxCommands: 4 },
      threeStars: { maxCommands: 3 },
    },
    hints: ['Test'],
    solution: {
      logic: 'Move forward three times',
      commands: ['move_forward', 'move_forward', 'move_forward'],
      pythonCode: 'move_forward()\nmove_forward()\nmove_forward()',
    },
  };

  beforeEach(() => {
    engine = new GameEngine(mockLevel);
  });

  test('should move player forward', () => {
    const initialX = engine.stateData.player.x;
    engine.execute('move_forward');
    expect(engine.stateData.player.x).toBe(initialX + 1);
  });

  test('should turn player left', () => {
    const initialDir = engine.stateData.player.direction;
    engine.execute('turn_left');
    expect(engine.stateData.player.direction).not.toBe(initialDir);
  });

  test('should not move through walls', () => {
    // Placeholder for collision test
    const initialPos = { ...engine.stateData.player };
    // Assume moving left from x=1 would go out of bounds
    engine.execute('move_forward'); // move right
    engine.execute('move_forward'); // move right again
    engine.execute('move_forward'); // move right again
    engine.execute('move_forward'); // move right again
    engine.execute('move_forward'); // try to move beyond grid
    // Position should not change beyond grid bounds
    expect(engine.stateData.player.x).toBeLessThanOrEqual(engine.stateData.grid.cols);
    expect(engine.stateData.lastError?.reason).toBe('blocked_wall');
  });

  test('should move with absolute left and right commands', async () => {
    await expect(engine.execute('move_right')).resolves.toBe(true);
    expect(engine.stateData.player).toMatchObject({ x: 2, y: 1, direction: 'right' });

    await expect(engine.execute('move_left')).resolves.toBe(true);
    expect(engine.stateData.player).toMatchObject({ x: 1, y: 1, direction: 'left' });
  });

  test('should report obstacle collisions', async () => {
    const obstacleEngine = new GameEngine({
      ...mockLevel,
      obstacles: [{ x: 2, y: 1, type: 'wall' }],
    });

    await expect(obstacleEngine.execute('move_forward')).resolves.toBe(false);
    expect(obstacleEngine.stateData.player).toMatchObject({ x: 1, y: 1 });
    expect(obstacleEngine.stateData.lastError).toMatchObject({
      reason: 'blocked_obstacle',
      x: 2,
      y: 1,
    });
  });

  test('should detect goal completion', () => {
    // Move to goal position
    engine.execute('move_forward'); // x=2
    engine.execute('move_forward'); // x=3
    engine.execute('move_forward'); // x=4 (goal)
    expect(engine.checkGoal()).toBe(true);
  });

  test('should execute repeat commands as one player block', async () => {
    await expect(engine.execute('repeat(3): move_forward')).resolves.toBe(true);

    expect(engine.stateData.player.x).toBe(4);
    expect(engine.stateData.commandCount).toBe(1);
    expect(engine.checkGoal()).toBe(true);
  });

  test('should execute nested repeat commands', async () => {
    await expect(engine.execute('repeat(3): repeat(1): move_forward')).resolves.toBe(true);

    expect(engine.stateData.player.x).toBe(4);
    expect(engine.stateData.commandCount).toBe(1);
    expect(engine.checkGoal()).toBe(true);
  });

  test('should execute condition command when obstacle is ahead', async () => {
    const conditionEngine = new GameEngine({
      ...mockLevel,
      player: { x: 0, y: 2, direction: 'right' as const },
      goal: { x: 2, y: 1, type: 'door' },
      obstacles: [{ x: 1, y: 2, type: 'wall' }],
    });

    await expect(conditionEngine.execute('if obstacle_ahead(): move_up')).resolves.toBe(true);
    await expect(conditionEngine.execute('move_right')).resolves.toBe(true);
    await expect(conditionEngine.execute('move_right')).resolves.toBe(true);

    expect(conditionEngine.stateData.commandCount).toBe(3);
    expect(conditionEngine.checkGoal()).toBe(true);
  });

  test('should skip condition command when path is clear', async () => {
    await expect(engine.execute('if obstacle_ahead(): move_up')).resolves.toBe(true);

    expect(engine.stateData.player).toMatchObject({ x: 1, y: 1, direction: 'right' });
    expect(engine.stateData.commandCount).toBe(1);
  });

  test('should execute condition fallback when path is clear', async () => {
    await expect(engine.execute('if obstacle_ahead(): move_up else: move_right')).resolves.toBe(true);

    expect(engine.stateData.player).toMatchObject({ x: 2, y: 1, direction: 'right' });
    expect(engine.stateData.commandCount).toBe(1);
  });

  test('should collect item with item_here condition', async () => {
    const itemEngine = new GameEngine({
      ...mockLevel,
      player: { x: 1, y: 1, direction: 'right' as const },
      goal: { x: 2, y: 1, type: 'door' },
      items: [{ x: 1, y: 1, type: 'carrot' }],
      successRules: {
        ...mockLevel.successRules,
        mustCollectItems: ['carrot'],
      },
    });

    await expect(itemEngine.execute('if item_here(): pick_item else: move_right')).resolves.toBe(true);

    expect(itemEngine.stateData.items).toHaveLength(0);
    expect(itemEngine.stateData.history).toContain('pick_item:1,1');
  });
});
