// src/modules/game/engine.ts
import { Character } from './character';
import { Grid } from './grid';
import { Collision } from './collision';
import { Item } from './item';
import { Goal } from './goal';
import type { Direction, LevelPosition, RobotLevelData } from '../levels/schema';

export interface GameState {
  commandCount: number;
  grid: Grid;
  player: Character;
  items: Item[];
  goal: Goal;
  obstacles: LevelPosition[];
  commands: string[];
  history: string[];
  isComplete: boolean;
  stars: number;
  lastError: GameError | null;
}

export type GameErrorReason = 'unknown_command' | 'blocked_wall' | 'blocked_obstacle' | 'missing_item';

export interface GameError {
  reason: GameErrorReason;
  command: string;
  x?: number;
  y?: number;
}

type ParsedCommand =
  | { kind: 'repeat'; times: number; inner: string }
  | { kind: 'condition'; predicate: 'obstacle_ahead' | 'item_here'; inner: string; fallback?: string }
  | { kind: 'simple'; name: string; steps: number };

export class GameEngine {
  // Callback invoked when a level is successfully completed. Receives the total command count.
  private onComplete?: (commandCount: number) => void;

  /**
   * Register a callback to be invoked when the level is completed.
   */
  setOnComplete(cb: (commandCount: number) => void): void {
    this.onComplete = cb;
  }
  private state: GameState;
  private collision: Collision;
  private initialLevel: RobotLevelData;

  constructor(level: RobotLevelData) {
    // initialize onComplete as no-op
    this.onComplete = undefined;
    this.initialLevel = level;
    this.state = {
      commandCount: 0,
      grid: new Grid(level.grid.rows, level.grid.cols),
      player: new Character(level.player.x, level.player.y, level.player.direction as Direction),
      items: (level.items || []).map((item) => new Item(item.x, item.y, item.type)),
      goal: new Goal(level.goal.x, level.goal.y, level.goal.type),
      obstacles: level.obstacles || [],
      commands: [],
      history: [],
      isComplete: false,
      stars: 0,
      lastError: null,
    };
    this.collision = new Collision(this.state.grid, this.state.obstacles);
  }

  get stateData(): GameState {
    return this.state;
  }

  /**
   * Execute a command string
   */
  async execute(command: string, countCommand = true): Promise<boolean> {
    if (countCommand) {
      this.state.commandCount = (this.state.commandCount ?? 0) + 1;
    }
    this.state.lastError = null;
    const parsed = this.parseCommand(command);

    if (parsed.kind === 'repeat') {
      for (let i = 0; i < parsed.times; i++) {
        const innerResult = await this.execute(parsed.inner, false);
        if (!innerResult) return false;
      }
      this.state.commands.push(command);
      this.state.history.push(`repeat:${parsed.times}:${parsed.inner}`);
      return true;
    }

    if (parsed.kind === 'condition') {
      const shouldRun = parsed.predicate === 'obstacle_ahead' ? this.obstacleAhead() : this.itemHere();
      if (shouldRun) {
        const innerResult = await this.execute(parsed.inner, false);
        if (!innerResult) return false;
      } else if (parsed.fallback) {
        const fallbackResult = await this.execute(parsed.fallback, false);
        if (!fallbackResult) return false;
      }
      this.state.commands.push(command);
      this.state.history.push(`condition:${parsed.predicate}:${shouldRun ? 'true' : 'false'}`);
      return true;
    }

    switch (parsed.name) {
      case 'move_forward':
        return this.repeat(parsed.steps, () => this.moveForward(command));
      case 'move_left':
        this.state.player.direction = 'left';
        return this.repeat(parsed.steps, () => this.moveForward(command));
      case 'move_right':
        this.state.player.direction = 'right';
        return this.repeat(parsed.steps, () => this.moveForward(command));
      case 'move_up':
        this.state.player.direction = 'up';
        return this.repeat(parsed.steps, () => this.moveForward(command));
      case 'move_down':
        this.state.player.direction = 'down';
        return this.repeat(parsed.steps, () => this.moveForward(command));
      case 'turn_left':
        this.turn('left');
        return true;
      case 'turn_right':
        this.turn('right');
        return true;
      case 'pick_item':
        return this.pickItem(command);
      default:
        this.state.lastError = { reason: 'unknown_command', command };
        this.state.history.push(`unknown:${command}`);
        return false;
    }
  }

  private parseCommand(command: string): ParsedCommand {
    const trimmed = command.trim();
    const repeatMatch = trimmed.match(/^repeat\((\d+)\):\s*(.+)$/);
    if (repeatMatch) {
      return {
        kind: 'repeat',
        times: Number(repeatMatch[1]),
        inner: repeatMatch[2],
      };
    }

    const conditionMatch = trimmed.match(/^if\s+(obstacle_ahead|item_here)\(\):\s*(.+?)(?:\s+else:\s*(.+))?$/);
    if (conditionMatch) {
      return {
        kind: 'condition',
        predicate: conditionMatch[1] as 'obstacle_ahead' | 'item_here',
        inner: conditionMatch[2],
        fallback: conditionMatch[3],
      };
    }

    const match = trimmed.match(/^([a-z_]+)(?:\((\d*)\))?$/);
    const rawName = match?.[1] || trimmed;
    const aliases: Record<string, string> = {
      forward: 'move_forward',
      left: 'move_left',
      right: 'move_right',
      up: 'move_up',
      down: 'move_down',
    };

    return {
      kind: 'simple',
      name: aliases[rawName] || rawName,
      steps: Number(match?.[2] || 1),
    };
  }

  private repeat(times: number, action: () => boolean): boolean {
    for (let i = 0; i < times; i++) {
      if (!action()) return false;
    }
    return true;
  }

  private obstacleAhead(): boolean {
    const { x, y, direction } = this.state.player;
    let nextX = x;
    let nextY = y;

    switch (direction) {
      case 'up':
        nextY--;
        break;
      case 'down':
        nextY++;
        break;
      case 'left':
        nextX--;
        break;
      case 'right':
        nextX++;
        break;
    }

    return !this.collision.check(nextX, nextY);
  }

  private itemHere(): boolean {
    const { x, y } = this.state.player;
    return this.state.items.some((item) => item.x === x && item.y === y);
  }

  private moveForward(command: string): boolean {
    const { x, y, direction } = this.state.player;
    let newX = x;
    let newY = y;

    switch (direction) {
      case 'up':
        newY--;
        break;
      case 'down':
        newY++;
        break;
      case 'left':
        newX--;
        break;
      case 'right':
        newX++;
        break;
    }

    if (this.collision.check(newX, newY)) {
      this.state.player.x = newX;
      this.state.player.y = newY;
      this.state.commands.push('move_forward');
      this.state.history.push(`move_forward:${newX},${newY}`);
      return true;
    }

    const reason = this.isOutsideGrid(newX, newY) ? 'blocked_wall' : 'blocked_obstacle';
    this.state.lastError = { reason, command, x: newX, y: newY };
    this.state.history.push(`blocked:${newX},${newY}`);
    return false;
  }

  private isOutsideGrid(x: number, y: number): boolean {
    return x < 0 || x >= this.state.grid.cols || y < 0 || y >= this.state.grid.rows;
  }

  private turn(direction: string): void {
    const order = ['up', 'right', 'down', 'left'];
    const idx = order.indexOf(this.state.player.direction);
    const delta = direction === 'left' ? -1 : 1;
    this.state.player.direction = order[(idx + delta + 4) % 4] as Direction;
    this.state.commands.push(`turn_${direction}`);
    this.state.history.push(`turn_${direction}:${this.state.player.direction}`);
  }

  private pickItem(command: string): boolean {
    const { x, y } = this.state.player;
    const itemIndex = this.state.items.findIndex(
      (item) => item.x === x && item.y === y
    );
    if (itemIndex !== -1) {
      this.state.items.splice(itemIndex, 1);
      this.state.commands.push('pick_item');
      this.state.history.push(`pick_item:${x},${y}`);
      return true;
    }
    this.state.lastError = { reason: 'missing_item', command, x, y };
    this.state.history.push(`pick_failed:${x},${y}`);
    return false;
  }

  /**
   * Check if goal reached
   */
  checkGoal(): boolean {
    const { player, goal } = this.state;
    const requiredItems = this.initialLevel.successRules?.mustCollectItems || [];
    const stillMissingRequiredItem = requiredItems.some((type) =>
      this.state.items.some((item) => item.type === type)
    );
    if (player.x === goal.x && player.y === goal.y && !stillMissingRequiredItem) {
      this.state.isComplete = true;
      // invoke completion callback with total command count
      this.onComplete?.(this.state.commandCount);
      return true;
    }
    return false;
  }

  /**
   * Reset to initial state
   */
  reset(level: RobotLevelData = this.initialLevel): void {
    this.initialLevel = level;
    this.state = {
      commandCount: 0,
      grid: new Grid(level.grid.rows, level.grid.cols),
      player: new Character(level.player.x, level.player.y, level.player.direction as Direction),
      items: (level.items || []).map((item) => new Item(item.x, item.y, item.type)),
      goal: new Goal(level.goal.x, level.goal.y, level.goal.type),
      obstacles: level.obstacles || [],
      commands: [],
      history: [],
      isComplete: false,
      stars: 0,
      lastError: null,
    };
    this.collision = new Collision(this.state.grid, this.state.obstacles);
  }
}
