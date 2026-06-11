// src/modules/game/collision.ts
import { Grid } from './grid';
import type { LevelPosition } from '../levels/schema';

export class Collision {
  constructor(private grid: Grid, private obstacles: LevelPosition[] = []) {}

  check(x: number, y: number): boolean {
    if (x < 0 || x >= this.grid.cols || y < 0 || y >= this.grid.rows) {
      return false;
    }
    return !this.obstacles.some((obstacle) => obstacle.x === x && obstacle.y === y);
  }
}
