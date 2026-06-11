import { Errors } from './errors';
import type { ProgramNode, StatementNode } from './parser';

export interface ExecResult {
  success: boolean;
  output?: {
    x: number;
    y: number;
    direction: string;
    inventory: string[];
    commands: StatementNode[];
  };
  error?: string;
}

export class Executor {
  private state = {
    x: 0,
    y: 0,
    direction: 'right' as 'up' | 'right' | 'down' | 'left',
    inventory: [] as string[],
  };

  compile(program: ProgramNode): StatementNode[] {
    return program.statements;
  }

  async run(commands: StatementNode[]): Promise<ExecResult> {
    try {
      for (const command of commands) {
        this.executeCommand(command);
      }

      return {
        success: true,
        output: {
          ...this.state,
          commands,
        },
      };
    } catch (err) {
      return { success: false, error: Errors.format([err]) };
    }
  }

  measureTime(_commands: StatementNode[]): number {
    return 0;
  }

  reset(): void {
    this.state = { x: 0, y: 0, direction: 'right', inventory: [] };
  }

  private executeCommand(command: StatementNode): void {
    if (command.kind === 'repeat') {
      for (let i = 0; i < command.times; i++) {
        this.executeCommand(command.inner);
      }
      return;
    }

    if (command.kind === 'condition') {
      this.executeCommand(command.inner);
      return;
    }

    switch (command.name) {
      case 'move_forward':
        this.moveForward(command.args[0] ?? 1);
        return;
      case 'move_left':
        this.state.direction = 'left';
        this.moveForward(command.args[0] ?? 1);
        return;
      case 'move_right':
        this.state.direction = 'right';
        this.moveForward(command.args[0] ?? 1);
        return;
      case 'move_up':
        this.state.direction = 'up';
        this.moveForward(command.args[0] ?? 1);
        return;
      case 'move_down':
        this.state.direction = 'down';
        this.moveForward(command.args[0] ?? 1);
        return;
      case 'turn_left':
        this.turn(-1);
        return;
      case 'turn_right':
        this.turn(1);
        return;
      case 'pick_item':
        this.state.inventory.push('item');
        return;
      default:
        throw Errors.RuntimeError(`Unsupported command: ${String(command.name)}`);
    }
  }

  private moveForward(steps: number): void {
    switch (this.state.direction) {
      case 'right':
        this.state.x += steps;
        break;
      case 'left':
        this.state.x -= steps;
        break;
      case 'up':
        this.state.y -= steps;
        break;
      case 'down':
        this.state.y += steps;
        break;
    }
  }

  private turn(delta: -1 | 1): void {
    const directions = ['up', 'right', 'down', 'left'] as const;
    const index = directions.indexOf(this.state.direction);
    this.state.direction = directions[(index + delta + directions.length) % directions.length];
  }
}
