// src/modules/game/character.ts
export class Character {
  constructor(
    public x: number,
    public y: number,
    public direction: 'up' | 'down' | 'left' | 'right'
  ) {}
}