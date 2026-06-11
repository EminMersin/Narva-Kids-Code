export interface WorkspaceBlock {
  type: string;
}

export class Blockly {
  private blocks: WorkspaceBlock[] = [];

  constructor(private containerId: string) {}

  defineBlock(_definition: unknown): void {}

  getPythonCode(): string {
    return this.blocks
      .map((block) => {
        if (block.type === 'move_forward') return 'move_forward()';
        if (block.type === 'move_left') return 'move_left()';
        if (block.type === 'move_right') return 'move_right()';
        if (block.type === 'move_up') return 'move_up()';
        if (block.type === 'move_down') return 'move_down()';
        if (block.type === 'turn_left') return 'turn_left()';
        if (block.type === 'turn_right') return 'turn_right()';
        if (block.type === 'pick_item') return 'pick_item()';
        return `# unknown block: ${block.type}`;
      })
      .join('\n');
  }

  addBlocks(blocks: WorkspaceBlock[]): void {
    this.blocks.push(...blocks);
  }

  clear(): void {
    this.blocks = [];
  }

  getContainerId(): string {
    return this.containerId;
  }
}
