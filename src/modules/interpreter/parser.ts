import { Errors } from './errors';

export type CommandName =
  | 'move_forward'
  | 'move_left'
  | 'move_right'
  | 'move_up'
  | 'move_down'
  | 'turn_left'
  | 'turn_right'
  | 'pick_item';

export interface CommandNode {
  kind: 'command';
  name: CommandName;
  args: number[];
  line: number;
  source: string;
}

export interface RepeatNode {
  kind: 'repeat';
  times: number;
  inner: StatementNode;
  line: number;
  source: string;
}

export interface ConditionNode {
  kind: 'condition';
  predicate: 'obstacle_ahead' | 'item_here';
  inner: StatementNode;
  fallback?: StatementNode;
  line: number;
  source: string;
}

export type StatementNode = CommandNode | RepeatNode | ConditionNode;

export interface ProgramNode {
  statements: StatementNode[];
}

const COMMAND_RE = /^(forward|left|right|up|down|move_forward|move_left|move_right|move_up|move_down|turn_left|turn_right|pick_item)(?:\s*\(([^)]*)\))?\s*$/;
const REPEAT_RE = /^repeat\s*\((\d+)\)\s*:\s*(.+)$/;
const CONDITION_RE = /^if\s+(obstacle_ahead|item_here)\s*\(\)\s*:\s*(.+?)(?:\s+else:\s*(.+))?$/;
const COMMAND_ALIASES: Record<string, CommandName> = {
  forward: 'move_forward',
  left: 'move_left',
  right: 'move_right',
  up: 'move_up',
  down: 'move_down',
};

function parseArgs(command: CommandName, rawArgs: string, line: number): number[] {
  const trimmed = rawArgs.trim();
  if (!trimmed) return command === 'move_forward' ? [1] : [];

  if (!command.startsWith('move_')) {
    throw Errors.SyntaxError(`${command}() does not accept arguments on line ${line}.`);
  }

  if (!/^\d+$/.test(trimmed)) {
    throw Errors.SyntaxError(`${command}() expects a positive number on line ${line}.`);
  }

  return [Number(trimmed)];
}

function parseStatement(line: string, lineNumber: number): StatementNode {
  if (/^(import|open|eval|exec|while\s+True)/.test(line)) {
    throw Errors.SyntaxError(`Bu kod bu oyunda guvenli degil. ${lineNumber}. satiri degistir.`);
  }

  const repeatMatch = line.match(REPEAT_RE);
  if (repeatMatch) {
    return {
      kind: 'repeat',
      times: Number(repeatMatch[1]),
      inner: parseStatement(repeatMatch[2].trim(), lineNumber),
      line: lineNumber,
      source: line,
    };
  }

  const conditionMatch = line.match(CONDITION_RE);
  if (conditionMatch) {
    return {
      kind: 'condition',
      predicate: conditionMatch[1] as 'obstacle_ahead' | 'item_here',
      inner: parseStatement(conditionMatch[2].trim(), lineNumber),
      fallback: conditionMatch[3] ? parseStatement(conditionMatch[3].trim(), lineNumber) : undefined,
      line: lineNumber,
      source: line,
    };
  }

  const match = line.match(COMMAND_RE);
  if (!match) {
    throw Errors.SyntaxError(`${lineNumber}. satirdaki komutu tanimiyorum. Bloklardan birini kullanmayi dene.`);
  }

  const command = COMMAND_ALIASES[match[1]] || (match[1] as CommandName);
  return {
    kind: 'command',
    name: command,
    args: parseArgs(command, match[2] ?? '', lineNumber),
    line: lineNumber,
    source: line,
  };
}

export function parse(code: string): ProgramNode {
  const statements: StatementNode[] = [];
  const lines = code.split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) return;

    statements.push(parseStatement(line, lineNumber));
  });

  return { statements };
}

export class Parser {
  parse(code: string): ProgramNode {
    return parse(code);
  }
}
