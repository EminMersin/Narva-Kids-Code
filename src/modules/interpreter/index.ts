/**
 * Interpreter – Code Validation & Execution
 * - Parse Python-like syntax
 * - Validate against white-list/command rules
 * - Compile to safe execution plan
 * - Execute commands in sandbox
 */

import { Parser } from './parser';
import { Executor } from './executor';
import { Validator } from './validator';
import { Errors } from './errors';
import type { ProgramNode, StatementNode } from './parser';

export interface CommandSpec {
  name: string;
  signature: string;
  params?: string[];
  description: string;
}

export type CompileResult =
  | { success: true; commands: string[]; program: ProgramNode }
  | { success: false; error: string };

type Scope = Record<string, number | string | boolean>;

interface SourceLine {
  text: string;
  indent: number;
  line: number;
}

type DslStatement =
  | { kind: 'command'; name: string; arg?: string; line: number }
  | { kind: 'assign'; name: string; expr: string; line: number }
  | { kind: 'repeat'; times: string; body: DslStatement[]; line: number }
  | { kind: 'if'; condition: string; thenBranch: DslStatement[]; elseBranch: DslStatement[]; line: number }
  | { kind: 'while'; condition: string; body: DslStatement[]; line: number }
  | { kind: 'for'; variable: string; times: string; body: DslStatement[]; line: number }
  | { kind: 'match'; expr: string; cases: Array<{ value: string; body: DslStatement[] }>; line: number };

const COMMAND_ALIASES: Record<string, string> = {
  forward: 'move_forward',
  left: 'move_left',
  right: 'move_right',
  up: 'move_up',
  down: 'move_down',
};

const COMMAND_NAMES = new Set([
  'move_forward',
  'move_left',
  'move_right',
  'move_up',
  'move_down',
  'turn_left',
  'turn_right',
  'pick_item',
]);

const SYNTAX_COMMANDS = new Set([
  'assignment',
  'expression',
  'operator',
  'if_else',
  'while',
  'for_range',
  'match_case',
]);

function commandToCode(statement: StatementNode): string {
  if (statement.kind === 'repeat') {
    return `repeat(${statement.times}): ${commandToCode(statement.inner)}`;
  }
  if (statement.kind === 'condition') {
    const fallback = statement.fallback ? ` else: ${commandToCode(statement.fallback)}` : '';
    return `if ${statement.predicate}(): ${commandToCode(statement.inner)}${fallback}`;
  }

  const steps = statement.args[0];
  return steps && steps !== 1 ? `${statement.name}(${steps})` : statement.name;
}

export function compileCode(rawCode: string, availableCommands?: string[]): CompileResult {
  const advancedResult = compileAdvancedCode(rawCode, availableCommands);
  if (advancedResult) return advancedResult;

  try {
    const parser = new Parser();
    const validator = new Validator();
    const program = parser.parse(rawCode);
    const validation = validator.validate(program, { availableCommands });

    if (!validation.valid) {
      return {
        success: false,
        error: Errors.format(validation.errors),
      };
    }

    return {
      success: true,
      commands: program.statements.map(commandToCode),
      program,
    };
  } catch (error) {
    return {
      success: false,
      error: Errors.format([error]),
    };
  }
}

function compileAdvancedCode(rawCode: string, availableCommands?: string[]): CompileResult | null {
  if (!usesAdvancedSyntax(rawCode)) return null;

  try {
    const lines = normalizeLines(rawCode);
    const parsed = parseBlock(lines, 0, 0);
    const scope: Scope = {};
    const commands = compileStatements(parsed.statements, scope, availableCommands);

    return {
      success: true,
      commands,
      program: { statements: [] } as ProgramNode,
    };
  } catch (error) {
    return {
      success: false,
      error: Errors.format([error]),
    };
  }
}

function usesAdvancedSyntax(rawCode: string): boolean {
  return /^\s*(\w+\s*=|if\s+.+:\s*$|else\s*:|while\s+.+:|for\s+\w+\s+in\s+range|match\s+.+:|case\s+)/m.test(rawCode) ||
    /\b(move_forward|move_left|move_right|move_up|move_down)\s*\(\s*([^)\d\s][^)]*|[^)]*[+\-*/%][^)]*)\)/.test(rawCode);
}

function normalizeLines(rawCode: string): SourceLine[] {
  return rawCode
    .split(/\r?\n/)
    .map((raw, index) => ({
      text: raw.trim(),
      indent: raw.match(/^\s*/)?.[0].length ?? 0,
      line: index + 1,
    }))
    .filter((line) => line.text && !line.text.startsWith('#'));
}

function parseBlock(lines: SourceLine[], start: number, indent: number): { statements: DslStatement[]; next: number } {
  const statements: DslStatement[] = [];
  let index = start;

  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent) break;
    if (line.indent > indent) {
      throw Errors.SyntaxError(`${line.line}. satirda girinti beklenmeyen yerde.`);
    }
    if (/^(else|case)\b/.test(line.text)) break;

    const parsed = parseStatement(lines, index, indent);
    statements.push(parsed.statement);
    index = parsed.next;
  }

  return { statements, next: index };
}

function parseStatement(lines: SourceLine[], index: number, indent: number): { statement: DslStatement; next: number } {
  const line = lines[index];
  const text = line.text;

  if (/^(import|open|eval|exec|while\s+True)/.test(text)) {
    throw Errors.SyntaxError(`Bu kod bu oyunda guvenli degil. ${line.line}. satiri degistir.`);
  }

  const assign = text.match(/^([a-zA-Z_]\w*)\s*=\s*(.+)$/);
  if (assign) {
    return {
      statement: { kind: 'assign', name: assign[1], expr: assign[2], line: line.line },
      next: index + 1,
    };
  }

  const repeatInline = text.match(/^repeat\s*\((.+)\)\s*:\s*(.+)$/);
  if (repeatInline) {
    return {
      statement: {
        kind: 'repeat',
        times: repeatInline[1],
        body: [parseInlineCommand(repeatInline[2], line.line)],
        line: line.line,
      },
      next: index + 1,
    };
  }

  const repeatBlock = text.match(/^repeat\s*\((.+)\)\s*:\s*$/);
  if (repeatBlock) {
    const body = parseRequiredChildBlock(lines, index, indent, 'Tekrarla');
    return {
      statement: { kind: 'repeat', times: repeatBlock[1], body: body.statements, line: line.line },
      next: body.next,
    };
  }

  const ifInline = text.match(/^if\s+(.+?)\s*:\s*(.+?)(?:\s+else:\s*(.+))?$/);
  if (ifInline) {
    return {
      statement: {
        kind: 'if',
        condition: ifInline[1],
        thenBranch: [parseInlineCommand(ifInline[2], line.line)],
        elseBranch: ifInline[3] ? [parseInlineCommand(ifInline[3], line.line)] : [],
        line: line.line,
      },
      next: index + 1,
    };
  }

  const ifBlock = text.match(/^if\s+(.+)\s*:\s*$/);
  if (ifBlock) {
    const thenBlock = parseRequiredChildBlock(lines, index, indent, 'If');
    let next = thenBlock.next;
    let elseBranch: DslStatement[] = [];
    if (next < lines.length && lines[next].indent === indent && lines[next].text === 'else:') {
      const elseBlock = parseRequiredChildBlock(lines, next, indent, 'Else');
      elseBranch = elseBlock.statements;
      next = elseBlock.next;
    }
    return {
      statement: {
        kind: 'if',
        condition: ifBlock[1],
        thenBranch: thenBlock.statements,
        elseBranch,
        line: line.line,
      },
      next,
    };
  }

  const whileBlock = text.match(/^while\s+(.+)\s*:\s*$/);
  if (whileBlock) {
    const body = parseRequiredChildBlock(lines, index, indent, 'While');
    return {
      statement: { kind: 'while', condition: whileBlock[1], body: body.statements, line: line.line },
      next: body.next,
    };
  }

  const forBlock = text.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+range\s*\((.+)\)\s*:\s*$/);
  if (forBlock) {
    const body = parseRequiredChildBlock(lines, index, indent, 'For');
    return {
      statement: { kind: 'for', variable: forBlock[1], times: forBlock[2], body: body.statements, line: line.line },
      next: body.next,
    };
  }

  const matchBlock = text.match(/^match\s+(.+)\s*:\s*$/);
  if (matchBlock) {
    return parseMatch(lines, index, indent, matchBlock[1]);
  }

  return { statement: parseInlineCommand(text, line.line), next: index + 1 };
}

function parseRequiredChildBlock(lines: SourceLine[], index: number, indent: number, label: string): { statements: DslStatement[]; next: number } {
  const nextLine = lines[index + 1];
  if (!nextLine || nextLine.indent <= indent) {
    throw Errors.SyntaxError(`${lines[index].line}. satirdaki ${label} blogunun icine komut ekle.`);
  }
  return parseBlock(lines, index + 1, nextLine.indent);
}

function parseMatch(lines: SourceLine[], index: number, indent: number, expr: string): { statement: DslStatement; next: number } {
  const cases: Array<{ value: string; body: DslStatement[] }> = [];
  let cursor = index + 1;
  const caseIndent = lines[cursor]?.indent;

  if (caseIndent === undefined || caseIndent <= indent) {
    throw Errors.SyntaxError(`${lines[index].line}. satirdaki match bloguna case ekle.`);
  }

  while (cursor < lines.length && lines[cursor].indent === caseIndent && lines[cursor].text.startsWith('case ')) {
    const value = lines[cursor].text.replace(/^case\s+/, '').replace(/:\s*$/, '').trim();
    const body = parseRequiredChildBlock(lines, cursor, caseIndent, 'Case');
    cases.push({ value, body: body.statements });
    cursor = body.next;
  }

  return {
    statement: { kind: 'match', expr, cases, line: lines[index].line },
    next: cursor,
  };
}

function parseInlineCommand(text: string, line: number): DslStatement {
  const match = text.match(/^([a-zA-Z_]\w*)(?:\s*\(([^)]*)\))?\s*$/);
  if (!match) {
    throw Errors.SyntaxError(`${line}. satirdaki komutu tanimiyorum. Bloklardan birini kullanmayi dene.`);
  }
  const name = COMMAND_ALIASES[match[1]] || match[1];
  if (!COMMAND_NAMES.has(name)) {
    throw Errors.SyntaxError(`${line}. satirdaki komutu tanimiyorum: ${match[1]}`);
  }
  return { kind: 'command', name, arg: match[2]?.trim(), line };
}

function compileStatements(statements: DslStatement[], scope: Scope, availableCommands?: string[]): string[] {
  return statements.flatMap((statement) => compileStatement(statement, scope, availableCommands));
}

function compileStatement(statement: DslStatement, scope: Scope, availableCommands?: string[]): string[] {
  switch (statement.kind) {
    case 'assign':
      requireAvailable('assignment', statement.line, availableCommands);
      scope[statement.name] = evaluateExpression(statement.expr, scope, statement.line);
      return [];
    case 'command':
      requireAvailable(statement.name, statement.line, availableCommands);
      return [compileCommand(statement, scope)];
    case 'repeat': {
      requireAvailable('repeat', statement.line, availableCommands);
      const times = toLoopCount(evaluateExpression(statement.times, scope, statement.line), statement.line);
      const commands: string[] = [];
      for (let index = 0; index < times; index++) {
        commands.push(...compileStatements(statement.body, scope, availableCommands));
      }
      return commands;
    }
    case 'if': {
      const runtimePredicate = statement.condition.trim().match(/^(obstacle_ahead|item_here)\(\)$/);
      if (runtimePredicate && statement.thenBranch.length === 1) {
        requireAvailable(runtimePredicate[1] === 'obstacle_ahead' ? 'if_obstacle_ahead' : 'if_else', statement.line, availableCommands);
        const thenCommand = compileStatements(statement.thenBranch, { ...scope }, availableCommands)[0];
        const elseCommand = statement.elseBranch.length === 1
          ? compileStatements(statement.elseBranch, { ...scope }, availableCommands)[0]
          : null;
        return [elseCommand ? `if ${runtimePredicate[1]}(): ${thenCommand} else: ${elseCommand}` : `if ${runtimePredicate[1]}(): ${thenCommand}`];
      }
      requireAvailable('if_else', statement.line, availableCommands);
      return compileStatements(
        evaluateExpression(statement.condition, scope, statement.line) ? statement.thenBranch : statement.elseBranch,
        scope,
        availableCommands
      );
    }
    case 'while': {
      requireAvailable('while', statement.line, availableCommands);
      const commands: string[] = [];
      let guard = 0;
      while (evaluateExpression(statement.condition, scope, statement.line)) {
        guard += 1;
        if (guard > 24) {
          throw Errors.SyntaxError(`${statement.line}. satirdaki while dongusu cok uzun suruyor. Sayaci azaltmayi unutma.`);
        }
        commands.push(...compileStatements(statement.body, scope, availableCommands));
      }
      return commands;
    }
    case 'for': {
      requireAvailable('for_range', statement.line, availableCommands);
      const times = toLoopCount(evaluateExpression(statement.times, scope, statement.line), statement.line);
      const commands: string[] = [];
      for (let index = 0; index < times; index++) {
        scope[statement.variable] = index;
        commands.push(...compileStatements(statement.body, scope, availableCommands));
      }
      return commands;
    }
    case 'match': {
      requireAvailable('match_case', statement.line, availableCommands);
      const value = evaluateExpression(statement.expr, scope, statement.line);
      const selected = statement.cases.find((caseItem) => {
        if (caseItem.value === '_') return false;
        return evaluateExpression(caseItem.value, scope, statement.line) === value;
      }) ?? statement.cases.find((caseItem) => caseItem.value === '_');
      return selected ? compileStatements(selected.body, scope, availableCommands) : [];
    }
    default:
      return [];
  }
}

function requireAvailable(command: string, line: number, availableCommands?: string[]): void {
  if (!availableCommands) return;
  if (availableCommands.includes(command)) return;
  if ((command === 'operator' || command === 'expression') && availableCommands.some((item) => SYNTAX_COMMANDS.has(item))) return;
  throw Errors.SyntaxError(`${line}. satirdaki ${command} blogu bu seviyede kullanilamaz.`);
}

function compileCommand(statement: Extract<DslStatement, { kind: 'command' }>, scope: Scope): string {
  const arg = statement.arg ? evaluateExpression(statement.arg, scope, statement.line) : undefined;
  if (arg === undefined || arg === '' || arg === 1) return statement.name;
  const steps = toLoopCount(arg, statement.line);
  return `${statement.name}(${steps})`;
}

function toLoopCount(value: number | string | boolean, line: number): number {
  const count = Number(value);
  if (!Number.isInteger(count) || count < 1 || count > 24) {
    throw Errors.SyntaxError(`${line}. satirda sayi 1 ile 24 arasinda olmali.`);
  }
  return count;
}

function evaluateExpression(expr: string, scope: Scope, line: number): number | string | boolean {
  const normalized = expr
    .trim()
    .replace(/\band\b/g, '&&')
    .replace(/\bor\b/g, '||')
    .replace(/\bnot\b/g, '!');

  if (/(__|constructor|prototype|=>|;|\{|\}|\[|\]|`)/.test(normalized)) {
    throw Errors.SyntaxError(`${line}. satirdaki ifade guvenli degil.`);
  }
  if (!/^[\w\s+\-*/%().<>=!&|'",]+$/.test(normalized)) {
    throw Errors.SyntaxError(`${line}. satirdaki ifade bu oyunda kullanilamaz.`);
  }

  const names = Object.keys(scope);
  const unknownName = findUnknownName(normalized, scope);
  if (unknownName) {
    throw Errors.SyntaxError(`${line}. satirda ${unknownName} degiskeni henuz yok. Once ${unknownName} = sayi blogunu ekle.`);
  }

  try {
    // Inputs are restricted above; this keeps the educational DSL small without shipping a full expression parser.
    const fn = new Function(...names, `return (${normalized});`) as (...values: Array<number | string | boolean>) => number | string | boolean;
    return fn(...names.map((name) => scope[name]));
  } catch {
    throw Errors.SyntaxError(`${line}. satirdaki ifadeyi anlayamadim.`);
  }
}

function findUnknownName(expr: string, scope: Scope): string | null {
  const keywords = new Set(['true', 'false']);
  const withoutStrings = expr.replace(/"[^"]*"|'[^']*'/g, '');
  const matches = withoutStrings.match(/\b[a-zA-Z_]\w*\b/g) ?? [];
  return matches.find((name) => !(name in scope) && !keywords.has(name.toLowerCase())) ?? null;
}

/** Handle security constraints and message formatting */
export class ValidationError extends Error {
  code: string;
  level: 'warning' | 'critical';
  constructor(message: string, level: 'warning' | 'critical' = 'warning') {
    super(message);
    this.code = 'VALIDATION_ERROR';
    this.level = level;
  }
}

/**
 * Main interpreter class
 * - Parse raw input
 * - Validate against safety rules
 * - Compile to Python-like subsets
 * - Execute commands in restricted environment
 */
export class Interpreter {
  /** Parsed components */
  private parser = new Parser();
  private validator = new Validator();
  private executor = new Executor();
  private errors = new Errors();

  /**
   * Execute user-provided code safely
   * @param rawCode Raw user input string
   * @returns Execution result with success flag
   */
  async execute(rawCode: string): Promise<ExecutionResult> {
    try {
      const tokens = this.parser.parse(rawCode);
      const validation = this.validator.validate(tokens);

      if (!validation.valid) {
        // Compile error messages for UI display
        const formattedErrors = Errors.format(validation.errors);
        return {
          success: false,
          error: formattedErrors,
          stack: validation.stack,
        };
      }

      // Generate executable code from validated tokens
      const executable = this.executor.compile(tokens);
      const result = await this.executor.run(executable);

      return result.success
        ? {
            success: true,
            output: result.output,
            execTime: this.executor.measureTime(executable),
          }
        : {
            success: false,
            error: result.error,
          };
    } catch (error) {
      // Unexpected failures (e.g., syntax errors)
      return {
        success: false,
        error: Errors.format([error]),
        stack: Errors.getStack(error),
      };
    }
  }

  /**
   * Extract allowed command signatures
   */
  getSupportedCommands(): CommandSpec[] {
    return [
      {
        name: 'move_forward',
        signature: '(dist?: number) => void',
        params: ['dist'],
        description: 'Move forward optionally with step count',
      },
      {
        name: 'turn_left',
        signature: '() => void',
        description: 'Rotate left 90°',
      },
      {
        name: 'turn_right',
        signature: '() => void',
        description: 'Rotate right 90°',
      },
      {
        name: 'pick_item',
        signature: '() => boolean',
        description: 'Collect item under player',
      },
      {
        name: 'repeat',
        signature: '(times: number, command: CommandSpec) => void',
        params: ['times', 'command'],
        description: 'Repeat a safe movement command',
      },
      {
        name: 'if_obstacle_ahead',
        signature: '(command: CommandSpec) => void',
        params: ['command'],
        description: 'Run a command only when the next tile is blocked',
      },
    ];
  }
}

/** Result object type */
export interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  stack?: string;
  execTime?: number;
}
