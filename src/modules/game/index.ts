// src/modules/game/index.ts
import { GameEngine, GameState } from './engine';
import { Character } from './character';
import { Grid } from './grid';
import { Collision } from './collision';
import { Item } from './item';
import { Goal } from './goal';
import { Animation } from './animation';
import { Renderer } from './renderer';

export {
  GameEngine,
  Character,
  Grid,
  Collision,
  Item,
  Goal,
  Animation,
  Renderer,
};

export type { GameState };