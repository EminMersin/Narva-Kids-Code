// src/modules/game/renderer.ts
import { GameState } from './index';

export class Renderer {
  private container: HTMLElement;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Renderer: Container "${containerId}" not found`);
    }
    this.container = container;
  }

  render(state: GameState): void {
    // Simple SVG rendering for demonstration
    const svg = `
      <svg width="100%" height="100%" viewBox="0 0 ${state.grid.cols} ${state.grid.rows}" xmlns="http://www.w3.org/2000/svg">
        <!-- Grid background -->
        ${this.renderGrid(state.grid)}
        <!-- Player -->
        <g transform="translate(${state.player.x}, ${state.player.y})">
          <rect x="-0.4" y="-0.4" width="0.8" height="0.8" fill="blue" stroke="black" stroke-width="0.05"/>
          <text x="0.5" y="0.5" font-size="0.5" fill="white" text-anchor="middle">${state.player.direction}</text>
        </g>
        <!-- Goal -->
        <circle cx="${state.goal.x + 0.5}" cy="${state.goal.y + 0.5}" r="0.3" fill="green" />
        <!-- Items -->
        ${state.items.map(item => `<rect x="${item.x}" y="${item.y}" width="1" height="1" fill="yellow" />`).join('')}
      </svg>
    `;
    this.container.innerHTML = svg;
  }

  private renderGrid(grid: any): string {
    let gridHtml = '';
    for (let y = 0; y < grid.rows; y++) {
      for (let x = 0; x < grid.cols; x++) {
        gridHtml += `<rect x="${x}" y="${y}" width="1" height="1" fill="#eee" stroke="white" stroke-width="0.05" />`;
      }
    }
    return gridHtml;
  }
}