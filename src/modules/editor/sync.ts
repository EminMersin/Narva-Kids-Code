export interface SyncResult {
  isValid: boolean;
  errors: string[];
  code?: string;
}

export class Sync {
  validate(code: string): SyncResult {
    return validateCode(code);
  }
}

export function blocksToCode(workspace: { getAllBlocks?: () => Array<{ type: string }> }): SyncResult {
  const blocks = workspace.getAllBlocks?.() || [];
  const code = blocks
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

  return code.trim()
    ? { isValid: true, errors: [], code }
    : { isValid: false, errors: ['No blocks found'] };
}

export function codeToBlocks(code: string): string[] {
  return code
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/\(.*/, ''));
}

export function validateCode(code: string): SyncResult {
  const errors: string[] = [];
  const forbiddenCommands = ['import', 'open', 'eval', 'exec', 'system'];

  forbiddenCommands.forEach((command) => {
    if (code.includes(command)) errors.push(`Forbidden command detected: "${command}"`);
  });

  if ((code.match(/\(/g) || []).length !== (code.match(/\)/g) || []).length) {
    errors.push('Unmatched parentheses detected');
  }

  return errors.length ? { isValid: false, errors } : { isValid: true, errors: [], code };
}
