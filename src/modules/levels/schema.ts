export type Direction = 'up' | 'right' | 'down' | 'left';
export type LevelMode = 'easy' | 'medium' | 'hard';
export type LevelKind = 'robot' | 'web';

export interface LevelPosition {
  x: number;
  y: number;
}

export interface BaseLevelData {
  id: string;
  world: string;
  kind?: LevelKind;
  mode: LevelMode;
  order: number;
  title: string;
  learningOutcome: string;
  concept?: string;
  allowedSyntax?: string[];
  starterBlocks?: unknown[];
  requiredConcepts?: string[];
  maxLoopIterations?: number;
  topicTags?: string[];
  childIntro: string;
  starRules: {
    oneStar: { mustComplete: boolean };
    twoStars: { maxCommands: number };
    threeStars: { maxCommands: number };
  };
  hints: string[];
}

export interface RobotLevelData extends BaseLevelData {
  kind?: 'robot';
  grid: { rows: number; cols: number };
  player: LevelPosition & { direction: Direction };
  goal: LevelPosition & { type: string };
  obstacles: Array<LevelPosition & { type?: string }>;
  items: Array<LevelPosition & { type: string }>;
  availableCommands: string[];
  availableBlocks: string[];
  successRules: {
    mustReachGoal: boolean;
    mustCollectItems: string[];
    requiredCommands: string[];
    forbiddenCommands: string[];
  };
  solution: {
    logic: string;
    commands: string[];
    pythonCode: string;
  };
}

export type WebTag =
  | 'html'
  | 'head'
  | 'title'
  | 'body'
  | 'h1'
  | 'h2'
  | 'p'
  | 'strong'
  | 'br'
  | 'img'
  | 'a'
  | 'ul'
  | 'li'
  | 'div'
  | 'section'
  | 'button';

export type WebStyleProperty =
  | 'color'
  | 'background-color'
  | 'font-size'
  | 'text-align'
  | 'padding'
  | 'margin'
  | 'border'
  | 'border-radius';

export interface WebDocumentNode {
  id?: string;
  tag: WebTag;
  text?: string;
  attrs?: Record<string, string>;
  styles?: Partial<Record<WebStyleProperty, string>>;
  children?: WebDocumentNode[];
}

export interface WebLevelData extends BaseLevelData {
  kind: 'web';
  availableTags: WebTag[];
  availableStyles: WebStyleProperty[];
  web: {
    requiredTags: WebTag[];
    titleText?: string;
    visibleText?: string[];
    requiredStyles?: Array<{
      tag: WebTag;
      property: WebStyleProperty;
      value?: string;
    }>;
  };
  solution: {
    logic: string;
    commands: string[];
    htmlCode: string;
    cssCode: string;
    document: WebDocumentNode[];
  };
}

export type LevelData = RobotLevelData | WebLevelData;

export function isWebLevel(level: LevelData): level is WebLevelData {
  return level.kind === 'web';
}

export function isRobotLevel(level: LevelData): level is RobotLevelData {
  return level.kind !== 'web';
}

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: { issues: string[] } };

const COMMANDS = new Set([
  'move_forward',
  'move_left',
  'move_right',
  'move_up',
  'move_down',
  'turn_left',
  'turn_right',
  'pick_item',
  'repeat',
  'if_obstacle_ahead',
  'assignment',
  'expression',
  'operator',
  'if_else',
  'while',
  'for_range',
  'match_case',
]);
const DIRECTIONS = new Set(['up', 'right', 'down', 'left']);
const MODES = new Set(['easy', 'medium', 'hard']);
const KINDS = new Set(['robot', 'web']);
const WEB_TAGS = new Set([
  'html',
  'head',
  'title',
  'body',
  'h1',
  'h2',
  'p',
  'strong',
  'br',
  'img',
  'a',
  'ul',
  'li',
  'div',
  'section',
  'button',
]);
const WEB_STYLES = new Set([
  'color',
  'background-color',
  'font-size',
  'text-align',
  'padding',
  'margin',
  'border',
  'border-radius',
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function inGrid(position: LevelPosition, rows: number, cols: number): boolean {
  return position.x >= 0 && position.x < cols && position.y >= 0 && position.y < rows;
}

function sameCell(a: LevelPosition, b: LevelPosition): boolean {
  return a.x === b.x && a.y === b.y;
}

function requireString(value: Record<string, unknown>, key: string, issues: string[]): void {
  if (typeof value[key] !== 'string' || value[key] === '') {
    issues.push(`${key} must be a non-empty string`);
  }
}

function requireNumber(value: Record<string, unknown>, key: string, issues: string[]): void {
  if (typeof value[key] !== 'number' || !Number.isFinite(value[key])) {
    issues.push(`${key} must be a number`);
  }
}

function parseRepeatCommand(command: string): { times: number; inner: string } | null {
  const match = command.trim().match(/^repeat\((\d+)\):\s*(.+)$/);
  if (!match) return null;
  return {
    times: Number(match[1]),
    inner: match[2].trim(),
  };
}

function parseConditionCommand(command: string): { predicate: string; inner: string; fallback?: string } | null {
  const match = command.trim().match(/^if\s+(obstacle_ahead|item_here)\(\):\s*(.+?)(?:\s+else:\s*(.+))?$/);
  if (!match) return null;
  return {
    predicate: match[1],
    inner: match[2].trim(),
    fallback: match[3]?.trim(),
  };
}

function baseCommandName(command: string): string {
  const repeat = parseRepeatCommand(command);
  if (repeat) return 'repeat';
  const condition = parseConditionCommand(command);
  if (condition) return 'if_obstacle_ahead';
  return command.trim().replace(/\(.*\)$/, '');
}

function isKnownSolutionCommand(command: string): boolean {
  const repeat = parseRepeatCommand(command);
  if (repeat) {
    return repeat.times > 0 && isKnownSolutionCommand(repeat.inner);
  }
  const condition = parseConditionCommand(command);
  if (condition) {
    return isKnownSolutionCommand(condition.inner) && (!condition.fallback || isKnownSolutionCommand(condition.fallback));
  }
  return COMMANDS.has(baseCommandName(command));
}

function isSolutionCommandAvailable(command: string, availableCommands: string[]): boolean {
  const repeat = parseRepeatCommand(command);
  if (repeat) {
    return availableCommands.includes('repeat') && isSolutionCommandAvailable(repeat.inner, availableCommands);
  }
  const condition = parseConditionCommand(command);
  if (condition) {
    const conditionAvailable = condition.predicate === 'obstacle_ahead'
      ? availableCommands.includes('if_obstacle_ahead') || availableCommands.includes('if_else')
      : availableCommands.includes('if_else');
    return conditionAvailable &&
      isSolutionCommandAvailable(condition.inner, availableCommands) &&
      (!condition.fallback || isSolutionCommandAvailable(condition.fallback, availableCommands));
  }
  return availableCommands.includes(baseCommandName(command));
}

export const LevelSchema = {
  safeParse(input: unknown): ParseResult<LevelData> {
    const issues: string[] = [];

    if (!isObject(input)) {
      return { success: false, error: { issues: ['Level must be an object'] } };
    }

    requireString(input, 'id', issues);
    requireString(input, 'world', issues);
    requireString(input, 'title', issues);
    requireString(input, 'learningOutcome', issues);
    requireString(input, 'childIntro', issues);
    requireNumber(input, 'order', issues);

    const kind = typeof input.kind === 'string' ? input.kind : 'robot';
    if (!KINDS.has(kind)) {
      issues.push('kind must be robot or web');
    }

    if (typeof input.mode !== 'string' || !MODES.has(input.mode)) {
      issues.push('mode must be easy, medium, or hard');
    }

    const starRules = isObject(input.starRules) ? input.starRules : null;
    if (!starRules || !isObject(starRules.twoStars) || !isObject(starRules.threeStars)) {
      issues.push('starRules.twoStars and starRules.threeStars are required');
    } else if (
      typeof starRules.twoStars.maxCommands === 'number' &&
      typeof starRules.threeStars.maxCommands === 'number' &&
      starRules.threeStars.maxCommands > starRules.twoStars.maxCommands
    ) {
      issues.push('starRules.threeStars.maxCommands must be <= twoStars.maxCommands');
    }

    if (!Array.isArray(input.hints) || input.hints.length === 0) {
      issues.push('hints must include at least one hint');
    }

    if (kind === 'web') {
      validateWebLevel(input, issues);
      return issues.length
        ? { success: false, error: { issues } }
        : { success: true, data: input as unknown as LevelData };
    }

    const grid = input.grid;
    if (!isObject(grid) || typeof grid.rows !== 'number' || typeof grid.cols !== 'number') {
      issues.push('grid.rows and grid.cols are required numbers');
    } else if (grid.rows < 3 || grid.cols < 3) {
      issues.push('grid must be at least 3x3');
    }

    const player = input.player;
    if (!isObject(player) || typeof player.x !== 'number' || typeof player.y !== 'number') {
      issues.push('player.x and player.y are required numbers');
    } else if (typeof player.direction !== 'string' || !DIRECTIONS.has(player.direction)) {
      issues.push('player.direction is invalid');
    }

    const goal = input.goal;
    if (!isObject(goal) || typeof goal.x !== 'number' || typeof goal.y !== 'number') {
      issues.push('goal.x and goal.y are required numbers');
    }

    const obstacles = Array.isArray(input.obstacles) ? input.obstacles : [];
    const items = Array.isArray(input.items) ? input.items : [];

    if (isObject(grid)) {
      const rows = Number(grid.rows);
      const cols = Number(grid.cols);
      if (isObject(player) && typeof player.x === 'number' && typeof player.y === 'number') {
        if (!inGrid(player as unknown as LevelPosition, rows, cols)) issues.push('player is outside grid');
      }
      if (isObject(goal) && typeof goal.x === 'number' && typeof goal.y === 'number') {
        if (!inGrid(goal as unknown as LevelPosition, rows, cols)) issues.push('goal is outside grid');
      }

      obstacles.forEach((obstacle, index) => {
        if (!isObject(obstacle) || typeof obstacle.x !== 'number' || typeof obstacle.y !== 'number') {
          issues.push(`obstacles[${index}] must have numeric x/y`);
          return;
        }
        if (!inGrid(obstacle as unknown as LevelPosition, rows, cols)) issues.push(`obstacles[${index}] is outside grid`);
        if (isObject(player) && sameCell(obstacle as unknown as LevelPosition, player as unknown as LevelPosition)) {
          issues.push(`obstacles[${index}] overlaps player`);
        }
        if (isObject(goal) && sameCell(obstacle as unknown as LevelPosition, goal as unknown as LevelPosition)) {
          issues.push(`obstacles[${index}] overlaps goal`);
        }
      });

      items.forEach((item, index) => {
        if (!isObject(item) || typeof item.x !== 'number' || typeof item.y !== 'number' || typeof item.type !== 'string') {
          issues.push(`items[${index}] must have numeric x/y and type`);
          return;
        }
        if (!inGrid(item as unknown as LevelPosition, rows, cols)) issues.push(`items[${index}] is outside grid`);
      });
    }

    const availableCommands = Array.isArray(input.availableCommands) ? input.availableCommands : [];
    const availableBlocks = Array.isArray(input.availableBlocks) ? input.availableBlocks : [];
    const solution = isObject(input.solution) ? input.solution : null;
    if (!availableCommands.length) issues.push('availableCommands is required');
    availableCommands.forEach((command) => {
      if (typeof command !== 'string' || !COMMANDS.has(command)) issues.push(`unknown available command: ${String(command)}`);
    });
    availableBlocks.forEach((block) => {
      if (typeof block !== 'string' || !COMMANDS.has(block)) issues.push(`unknown available block: ${String(block)}`);
    });

    if (!solution || !Array.isArray(solution.commands) || typeof solution.pythonCode !== 'string') {
      issues.push('solution.commands and solution.pythonCode are required');
    } else {
      solution.commands.forEach((command) => {
        if (typeof command !== 'string' || !isKnownSolutionCommand(command)) issues.push(`unknown solution command: ${String(command)}`);
        if (typeof command === 'string' && !isSolutionCommandAvailable(command, availableCommands as string[])) {
          issues.push(`solution command is not available: ${String(command)}`);
        }
      });
    }

    return issues.length
      ? { success: false, error: { issues } }
      : { success: true, data: input as unknown as LevelData };
  },
};

function validateWebLevel(input: Record<string, unknown>, issues: string[]): void {
  const availableTags = Array.isArray(input.availableTags) ? input.availableTags : [];
  const availableStyles = Array.isArray(input.availableStyles) ? input.availableStyles : [];
  const web = isObject(input.web) ? input.web : null;
  const solution = isObject(input.solution) ? input.solution : null;

  if (!availableTags.length) issues.push('availableTags is required for web levels');
  availableTags.forEach((tag) => {
    if (typeof tag !== 'string' || !WEB_TAGS.has(tag)) issues.push(`unknown web tag: ${String(tag)}`);
  });

  availableStyles.forEach((style) => {
    if (typeof style !== 'string' || !WEB_STYLES.has(style)) issues.push(`unknown web style: ${String(style)}`);
  });

  if (!web || !Array.isArray(web.requiredTags)) {
    issues.push('web.requiredTags is required for web levels');
  } else {
    web.requiredTags.forEach((tag) => {
      if (typeof tag !== 'string' || !WEB_TAGS.has(tag)) issues.push(`unknown required web tag: ${String(tag)}`);
      if (typeof tag === 'string' && !availableTags.includes(tag)) {
        issues.push(`required web tag is not available: ${tag}`);
      }
    });
  }

  if (web && Array.isArray(web.requiredStyles)) {
    web.requiredStyles.forEach((rule, index) => {
      if (!isObject(rule)) {
        issues.push(`web.requiredStyles[${index}] must be an object`);
        return;
      }
      if (typeof rule.tag !== 'string' || !WEB_TAGS.has(rule.tag)) {
        issues.push(`web.requiredStyles[${index}].tag is invalid`);
      }
      if (typeof rule.property !== 'string' || !WEB_STYLES.has(rule.property)) {
        issues.push(`web.requiredStyles[${index}].property is invalid`);
      }
      if (typeof rule.property === 'string' && !availableStyles.includes(rule.property)) {
        issues.push(`required style is not available: ${rule.property}`);
      }
    });
  }

  if (
    !solution ||
    !Array.isArray(solution.commands) ||
    typeof solution.htmlCode !== 'string' ||
    typeof solution.cssCode !== 'string' ||
    !Array.isArray(solution.document)
  ) {
    issues.push('solution.commands, solution.htmlCode, solution.cssCode and solution.document are required for web levels');
  }
}
