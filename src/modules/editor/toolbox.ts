import type { WorkspaceBlock } from './blockly';

export interface BlockDefinition {
  type: string;
  label: string;
  category: string;
  color: string;
  message0: string;
  tooltip?: string;
}

export class Toolbox {
  getBlocksForMode(mode: 'easy' | 'medium' | 'hard'): BlockDefinition[] {
    return getBlocksForMode(mode);
  }

  convertToBlocks(code: string): WorkspaceBlock[] {
    return code
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({ type: line.replace(/\(.*/, '') }));
  }
}

export const BASIC_BLOCKS: BlockDefinition[] = [
  {
    type: 'move_forward',
    label: 'Ileri Git',
    category: 'movement',
    color: '#4a90e2',
    message0: 'ileri git',
    tooltip: 'Karakteri ileri goturur',
  },
  {
    type: 'move_up',
    label: 'Yukari Git',
    category: 'movement',
    color: '#7d5cff',
    message0: 'yukari git',
    tooltip: 'Karakteri yukari goturur',
  },
  {
    type: 'move_down',
    label: 'Asagi Git',
    category: 'movement',
    color: '#20c997',
    message0: 'asagi git',
    tooltip: 'Karakteri asagi goturur',
  },
  {
    type: 'move_left',
    label: 'Sola Git',
    category: 'movement',
    color: '#ff5d8f',
    message0: 'sola git',
    tooltip: 'Karakteri sola goturur',
  },
  {
    type: 'move_right',
    label: 'Saga Git',
    category: 'movement',
    color: '#ff9f1c',
    message0: 'saga git',
    tooltip: 'Karakteri saga goturur',
  },
  {
    type: 'turn_left',
    label: 'Sola Don',
    category: 'movement',
    color: '#4a90e2',
    message0: 'sola don',
    tooltip: 'Karakteri sola dondurur',
  },
  {
    type: 'turn_right',
    label: 'Saga Don',
    category: 'movement',
    color: '#4a90e2',
    message0: 'saga don',
    tooltip: 'Karakteri saga dondurur',
  },
  {
    type: 'pick_item',
    label: 'Nesneyi Al',
    category: 'movement',
    color: '#4a90e2',
    message0: 'nesneyi al',
    tooltip: 'Bulundugu hucredeki nesneyi alir',
  },
];

export function getBlocksForMode(_mode: 'easy' | 'medium' | 'hard'): BlockDefinition[] {
  return BASIC_BLOCKS;
}

export function createToolboxXML(blocks: BlockDefinition[]): string {
  return `<xml>${blocks.map((block) => `<block type="${block.type}"></block>`).join('')}</xml>`;
}

export function defineBlocklyBlocks(_blocks: BlockDefinition[]): void {}
