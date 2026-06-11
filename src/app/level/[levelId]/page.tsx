'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type PointerEvent,
} from 'react';
import ResultPanel from '@/components/ResultPanel';
import FeedbackPopup from '@/components/FeedbackPopup';
import WebLevelPage from '@/components/WebLevelPage';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { GameEngine, type GameError } from '@/modules/game/engine';
import { compileCode } from '@/modules/interpreter';
import { isWebLevel, type RobotLevelData } from '@/modules/levels/schema';
import { WORLD_META, getFirstLevelId, getLevelById, getNextLevelId, levelRegistry, type WorldId } from '@/modules/levels/registry';
import { type LevelId, useProgress } from '@/store/progress';

const COMMAND_ALIASES: Record<string, string> = {
  forward: 'move_forward',
  left: 'move_left',
  right: 'move_right',
  up: 'move_up',
  down: 'move_down',
};

const COMMAND_META: Record<string, { label: string; shortLabel: string; symbol: string; color: string }> = {
  start: { label: 'Baslat', shortLabel: 'START', symbol: '▶', color: '#34c759' },
  move_forward: { label: 'Ileri Git', shortLabel: 'Ileri', symbol: '->', color: '#2989ff' },
  move_left: { label: 'Sola Git', shortLabel: 'Sol', symbol: '<-', color: '#ff5d8f' },
  move_right: { label: 'Saga Git', shortLabel: 'Sag', symbol: '->', color: '#ff9f1c' },
  move_up: { label: 'Yukari Git', shortLabel: 'Yukari', symbol: '^', color: '#7d5cff' },
  move_down: { label: 'Asagi Git', shortLabel: 'Asagi', symbol: 'v', color: '#20c997' },
  repeat: { label: 'Tekrarla', shortLabel: 'Tekrarla', symbol: 'x3', color: '#ffcf5a' },
  if_obstacle_ahead: { label: 'Eger Engel Varsa', shortLabel: 'Eger', symbol: '?', color: '#ff7a90' },
  assignment: { label: 'Degisken Ata', shortLabel: 'Degisken', symbol: '=', color: '#2dd4bf' },
  operator: { label: 'Operator', shortLabel: 'Operator', symbol: '+', color: '#f59f00' },
  if_else: { label: 'If Else', shortLabel: 'If Else', symbol: '?', color: '#ff7a90' },
  while: { label: 'While Dongusu', shortLabel: 'While', symbol: 'W', color: '#f76707' },
  for_range: { label: 'For Range', shortLabel: 'For', symbol: 'for', color: '#e03131' },
  match_case: { label: 'Match Case', shortLabel: 'Match', symbol: 'case', color: '#845ef7' },
  turn_left: { label: 'Sola Don', shortLabel: 'Don Sol', symbol: '<-', color: '#845ef7' },
  turn_right: { label: 'Saga Don', shortLabel: 'Don Sag', symbol: '->', color: '#f76707' },
  pick_item: { label: 'Nesneyi Al', shortLabel: 'Al', symbol: '*', color: '#2b8a3e' },
};

const TOOLBOX_COMMAND_ORDER = [
  'start',
  'assignment',
  'operator',
  'move_up',
  'move_right',
  'move_left',
  'move_down',
  'move_forward',
  'repeat',
  'if_else',
  'if_obstacle_ahead',
  'while',
  'for_range',
  'match_case',
  'pick_item',
];

const DIRECTION_COMMANDS = ['move_up', 'move_right', 'move_left', 'move_down', 'move_forward'];
const MAX_REPEAT_COUNT = 24;
const ROOT_CONTAINER_ID = 'root';
const TOOLBOX_CONTAINER_ID = 'toolbox';
const WORKSPACE_DRAGGING_CLASS = 'narva-workspace-dragging';

const DIRECTION_OPTIONS = [
  { command: 'move_up', label: 'Yukari', symbol: '^' },
  { command: 'move_right', label: 'Sag', symbol: '->' },
  { command: 'move_left', label: 'Sol', symbol: '<-' },
  { command: 'move_down', label: 'Asagi', symbol: 'v' },
  { command: 'move_forward', label: 'Ileri', symbol: '->' },
];

const CONDITION_OPTIONS = [
  { value: 'item_here()', label: 'nesne buradaysa' },
  { value: 'obstacle_ahead()', label: 'onunde engel varsa' },
];

const STEP_ARG_OPTIONS = [
  { value: '1', label: '1 adım' },
  { value: '2', label: '2 adım' },
  { value: '3', label: '3 adım' },
  { value: 'steps', label: 'steps' },
];

interface WorkspaceBlock {
  id: string;
  command: string;
  children?: WorkspaceBlock[];
  bodyChildren?: WorkspaceBlock[];
  thenChildren?: WorkspaceBlock[];
  elseChildren?: WorkspaceBlock[];
  stepArg?: string;
  conditionCommand?: string;
  variableName?: string;
  expression?: string;
  condition?: string;
  thenCommand?: string;
  elifCondition?: string;
  elifCommand?: string;
  elseCommand?: string;
  loopCount?: number;
  bodyCommand?: string;
  updateExpression?: string;
  matchVariable?: string;
  matchValue?: string;
  caseCommand?: string;
  defaultCommand?: string;
}

type EditorMode = 'blocks' | 'code';
type DragSource = { containerId: string; blockId: string; index: number };
type BlockContainerSlot = 'body' | 'then' | 'else';

function slotContainerId(blockId: string, slot: BlockContainerSlot): string {
  return `${blockId}:${slot}`;
}

function parseSlotContainerId(containerId: string): { blockId: string; slot: BlockContainerSlot } | null {
  const match = containerId.match(/^(.+):(body|then|else)$/);
  if (!match) return null;
  return { blockId: match[1], slot: match[2] as BlockContainerSlot };
}

function slotChildrenKey(slot: BlockContainerSlot): 'bodyChildren' | 'thenChildren' | 'elseChildren' {
  if (slot === 'then') return 'thenChildren';
  if (slot === 'else') return 'elseChildren';
  return 'bodyChildren';
}

function isActionBlock(command: string): boolean {
  return DIRECTION_COMMANDS.includes(command) || command === 'pick_item' || command === 'repeat';
}

function commandsFromCode(code: string): string[] {
  return code
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const compact = line.replace(/\s+/g, '');
      const match = compact.match(/^([a-z_]+)(.*)$/);
      if (!match) return compact;
      return `${COMMAND_ALIASES[match[1]] || match[1]}${match[2]}`;
    });
}

function calculateStars(level: RobotLevelData, completed: boolean, commandCount: number): number {
  if (!completed) return 0;
  if (commandCount <= level.starRules.threeStars.maxCommands) return 3;
  if (commandCount <= level.starRules.twoStars.maxCommands) return 2;
  return 1;
}

function commandLabel(command: string): string {
  const repeatMatch = command.match(/^repeat\((\d+)\):\s*(.+)$/);
  if (repeatMatch) {
    return `Tekrarla ${repeatMatch[1]} kez ${commandLabel(repeatMatch[2])}`;
  }
  const conditionMatch = command.match(/^if\s+obstacle_ahead\(\):\s*(.+)$/);
  if (conditionMatch) {
    return `Engel varsa ${commandLabel(conditionMatch[1])}`;
  }

  const commandName = command.replace(/\(\)$/, '');
  return COMMAND_META[commandName]?.label || commandName;
}

function levelHint(level: RobotLevelData, index = 0): string {
  return level.hints[index % level.hints.length] || 'Hedefe ulasmak icin komutlarini sirayla dene.';
}

function failureMessage(error: GameError | null, command: string, level: RobotLevelData): string {
  const hint = levelHint(level);

  switch (error?.reason) {
    case 'blocked_wall':
      return `Dur! ${commandLabel(command)} robotu oyun alaninin disina goturuyor. Ipucu: ${hint}`;
    case 'blocked_obstacle':
      return `O yolda bir engel var. Baska bir rota dene. Ipucu: ${hint}`;
    case 'missing_item':
      return `Burada alinacak bir nesne yok. Once dogru kareye git. Ipucu: ${hint}`;
    case 'unknown_command':
      return `Bu komutu henuz tanimiyorum: ${command}. move_forward(), move_left(), move_right(), move_up(), move_down() komutlarini deneyebilirsin.`;
    default:
      return `Bu komut calismadi: ${command}. Ipucu: ${hint}`;
  }
}

function compileCommandsForLevel(code: string, level: RobotLevelData): { commands: string[]; error?: string } {
  const compiled = compileCode(code, executionCommandsForLevel(level));
  if (!compiled.success) {
    return {
      commands: [],
      error: friendlyCompileError(compiled.error || 'Kodda kucuk bir sorun var. Bloklari tekrar kontrol et.'),
    };
  }
  return { commands: compiled.commands };
}

function executionCommandsForLevel(level: RobotLevelData): string[] {
  const commands = blockCommandsForLevel(level);
  if (!commands.includes('repeat')) return commands;
  return Array.from(new Set([...commands, 'assignment', 'operator']));
}

function friendlyCompileError(error: string): string {
  if (error.includes('degiskeni henuz yok') || error.includes('ifadeyi anlayamadim')) {
    return 'Adım alanındaki ifadeyi anlayamadım. steps kullanacaksan önce Değişken bloğunda steps = sayı oluştur.';
  }
  if (error.includes('sayi 1 ile 24 arasinda olmali')) {
    return 'Adım veya tekrar sayısı 1 ile 24 arasında olmalı.';
  }
  return error;
}

function resultFeedback(stars: number, commandCount: number, bestCommandCount: number): string {
  if (stars === 3) {
    return 'Harika rota. Bir sonraki seviyede ayni netlikle bloklari sirala.';
  }
  if (commandCount <= bestCommandCount + 1) {
    return 'Cok yaklastin. Bir blogu daha kisa bir yolla degistirmeyi deneyebilirsin.';
  }
  return 'Bir daha denerken gereksiz bloklari azaltmaya calis. Step modu hangi bloklarin fazla oldugunu gormene yardim eder.';
}

function clampRepeatCount(value: number | string): number {
  return Math.max(1, Math.min(MAX_REPEAT_COUNT, Number(value) || 1));
}

function executableBlocks(blocks: WorkspaceBlock[]): WorkspaceBlock[] {
  return blocks[0]?.command === 'start' ? blocks.slice(1) : [];
}

function linesFromBlock(block: WorkspaceBlock): string[] {
  if (block.command === 'start') return [];
  if (block.command === 'assignment') {
    const name = block.variableName?.trim() || 'steps';
    const expression = block.expression?.trim() || '3';
    return [`${name} = ${expression}`, ...(block.bodyChildren ?? []).flatMap(linesFromBlock)];
  }
  if (block.command === 'operator') {
    const name = block.variableName?.trim() || 'steps';
    const expression = block.expression?.trim() || '1 + 2';
    return [`${name} = ${expression}`, ...(block.bodyChildren ?? []).flatMap(linesFromBlock)];
  }
  if (DIRECTION_COMMANDS.includes(block.command)) {
    const arg = (block.stepArg || '').trim();
    return arg && arg !== '1' ? [`${block.command}(${arg})`] : [`${block.command}()`];
  }
  if (block.command === 'repeat') {
    const name = block.variableName?.trim() || 'steps';
    const expression = block.expression?.trim() || '1 + 2';
    const repeatLines = (block.children ?? []).flatMap((child) => {
      const childLines = linesFromRepeatChild(child, name);
      if (childLines.length === 0) return [];
      if (childLines.length === 1) return [`repeat(${name}): ${childLines[0]}`];
      return [`repeat(${name}):`, ...childLines.map((line) => `  ${line}`)];
    });
    return repeatLines.length ? [`${name} = ${expression}`, ...repeatLines] : [];
  }
  if (block.command === 'if_else') {
    const condition = block.condition || 'item_here()';
    const thenLine = (block.thenChildren ?? []).flatMap(linesFromBlock)[0] || block.thenCommand || 'pick_item';
    const elseLine = (block.elseChildren ?? []).flatMap(linesFromBlock)[0] || block.elseCommand || 'move_right';
    if (condition === 'item_here()' || condition === 'obstacle_ahead()') {
      return [`if ${condition}: ${thenLine} else: ${elseLine}`];
    }
    return [
      `if ${block.condition || 'obstacle_ahead()'}:`,
      `  ${thenLine}`,
      'else:',
      `  ${elseLine}`,
    ];
  }
  if (block.command === 'if_obstacle_ahead') {
    return block.conditionCommand ? [`if obstacle_ahead(): ${block.conditionCommand}`] : [];
  }
  if (block.command === 'while') {
    return [
      `${block.variableName || 'steps'} = ${block.loopCount || 3}`,
      `while ${block.condition || `${block.variableName || 'steps'} > 0`}:`,
      `  ${block.bodyCommand || 'move_right'}()`,
      `  ${block.updateExpression || `${block.variableName || 'steps'} = ${block.variableName || 'steps'} - 1`}`,
    ];
  }
  if (block.command === 'for_range') {
    return [
      `for i in range(${block.loopCount || 3}):`,
      `  ${block.bodyCommand || 'move_right'}()`,
    ];
  }
  if (block.command === 'match_case') {
    return [
      `${block.matchVariable || 'route'} = ${block.matchValue || '"right"'}`,
      `match ${block.matchVariable || 'route'}:`,
      '  case "right":',
      `    ${block.caseCommand || 'move_right'}()`,
      '  case _:',
      `    ${block.defaultCommand || 'move_up'}()`,
    ];
  }
  return [`${block.command}()`];
}

function linesFromRepeatChild(block: WorkspaceBlock, repeatVariableName: string): string[] {
  if (DIRECTION_COMMANDS.includes(block.command)) {
    const arg = (block.stepArg || '').trim();
    if (!arg || arg === '1' || arg === repeatVariableName) return [`${block.command}()`];
    return [`${block.command}(${arg})`];
  }
  return linesFromBlock(block);
}

function sourceIdsFromBlock(block: WorkspaceBlock): string[] {
  if (block.command === 'start') return [];
  if (block.command === 'repeat') {
    return [
      block.id,
      ...(block.children ?? []).flatMap((child) => linesFromBlock(child).map(() => child.id)),
    ];
  }
  if (block.command === 'assignment' || block.command === 'operator') {
    return [
      block.id,
      ...(block.bodyChildren ?? []).flatMap(sourceIdsFromBlock),
    ];
  }
  if (block.command === 'if_else') {
    return [block.id];
  }
  return linesFromBlock(block).map(() => block.id);
}

function codeFromBlocks(blocks: WorkspaceBlock[]): string {
  return executableBlocks(blocks).flatMap(linesFromBlock).join('\n');
}

function sourceIdsFromBlocks(blocks: WorkspaceBlock[]): string[] {
  return executableBlocks(blocks).flatMap(sourceIdsFromBlock);
}

function blockContainsSourceId(block: WorkspaceBlock, sourceId: string | null): boolean {
  if (!sourceId) return false;
  if (block.id === sourceId) return true;
  return [
    ...(block.children ?? []),
    ...(block.bodyChildren ?? []),
    ...(block.thenChildren ?? []),
    ...(block.elseChildren ?? []),
  ].some((child) => blockContainsSourceId(child, sourceId));
}

function createWorkspaceBlock(command: string, index: number): WorkspaceBlock {
  return {
    id: `${command}-${Date.now()}-${index}`,
    command,
    ...(command === 'repeat' ? { children: [], variableName: 'steps', expression: '1 + 2' } : {}),
    ...(DIRECTION_COMMANDS.includes(command) ? { stepArg: '1' } : {}),
    ...(command === 'if_obstacle_ahead' ? { conditionCommand: undefined } : {}),
    ...(command === 'assignment' ? { variableName: 'steps', expression: '3', bodyChildren: [] } : {}),
    ...(command === 'operator' ? { variableName: 'steps', expression: '1 + 2', bodyChildren: [] } : {}),
    ...(command === 'if_else' ? { condition: 'item_here()', thenChildren: [], elseChildren: [] } : {}),
    ...(command === 'while' ? { variableName: 'steps', loopCount: 3, condition: 'steps > 0', bodyCommand: 'move_right', updateExpression: 'steps = steps - 1' } : {}),
    ...(command === 'for_range' ? { loopCount: 3, bodyCommand: 'move_right' } : {}),
    ...(command === 'match_case' ? { matchVariable: 'route', matchValue: '"right"', caseCommand: 'move_right', defaultCommand: 'move_up' } : {}),
  };
}

function blockCommandsForLevel(level: RobotLevelData): string[] {
  const commands = level.availableBlocks.length ? level.availableBlocks : level.availableCommands;
  const withRepeat = commands.includes('repeat') ? commands : [...commands, 'repeat'];
  return withRepeat.includes('start') ? withRepeat : ['start', ...withRepeat];
}

function visibleToolboxCommands(level: RobotLevelData): string[] {
  const available = blockCommandsForLevel(level);
  return TOOLBOX_COMMAND_ORDER.filter((command) => {
    if (DIRECTION_COMMANDS.includes(command)) return false;
    return available.includes(command) && command !== 'expression' && command !== 'if_obstacle_ahead';
  });
}

function directionCommandsForLevel(level: RobotLevelData): typeof DIRECTION_OPTIONS {
  const available = blockCommandsForLevel(level);
  return DIRECTION_OPTIONS.filter((option) => available.includes(option.command));
}

function directionLabel(direction: string): string {
  const labels: Record<string, string> = {
    up: 'yukari',
    right: 'saga',
    down: 'asagi',
    left: 'sola',
  };
  return labels[direction] || direction;
}

function conceptLabel(concept?: string): string {
  const labels: Record<string, string> = {
    python_intro: 'Python satir sirasi',
    parameterized_commands: 'Parametreli komutlar',
    variables: 'Degiskenler',
    operators: 'Operatorler',
    if_else: 'If / Else kararlari',
    while: 'While dongusu',
    for_range: 'For / Range dongusu',
    match_case: 'Match / Case secimi',
    mini_challenge: 'Mini challenge',
  };
  return labels[concept || ''] || 'Python temeli';
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function LevelPage() {
  const params = useParams<{ levelId: string }>();
  const level = getLevelById(params.levelId) || getLevelById(getFirstLevelId())!;

  if (isWebLevel(level)) {
    return <WebLevelPage level={level} />;
  }

  return <RobotLevelPage level={level} />;
}

function RobotLevelPage({ level }: { level: RobotLevelData }) {
  const router = useRouter();
  const setCurrentLevel = useProgress((state) => state.setCurrentLevel);
  const [blocks, setBlocks] = useState<WorkspaceBlock[]>([]);
  const [message, setMessage] = useState('');
  const [player, setPlayer] = useState(level.player);
  const [items, setItems] = useState(level.items);
  const [stars, setStars] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [finalStars, setFinalStars] = useState(0);
  const [finalCommandCount, setFinalCommandCount] = useState(0);
  const [stepCommands, setStepCommands] = useState<string[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [activeCommandIndex, setActiveCommandIndex] = useState<number | null>(null);
  const [completedCommandCount, setCompletedCommandCount] = useState(0);
  const [errorCommandIndex, setErrorCommandIndex] = useState<number | null>(null);
  const [hintIndex, setHintIndex] = useState(0);
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [dragSourceContainerId, setDragSourceContainerId] = useState<string | null>(null);
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('blocks');
  const [manualCode, setManualCode] = useState('');
  const [selectedDirection, setSelectedDirection] = useState('move_right');
  const dragSourceRef = useRef<DragSource | null>(null);
  const touchDragSourceRef = useRef<DragSource | null>(null);

  const engine = useMemo(() => new GameEngine(level), [level]);
  const blockCode = codeFromBlocks(blocks);
  const blockSourceIds = sourceIdsFromBlocks(blocks);
  const activeCode = editorMode === 'code' ? manualCode : blockCode;
  const visibleCommands = commandsFromCode(activeCode);
  const activeSourceId = editorMode === 'blocks' && activeCommandIndex !== null ? blockSourceIds[activeCommandIndex] : null;
  const completedSourceIds = useMemo(
    () => new Set(editorMode === 'blocks' ? blockSourceIds.slice(0, completedCommandCount) : []),
    [blockSourceIds, completedCommandCount, editorMode],
  );
  const errorSourceId = editorMode === 'blocks' && errorCommandIndex !== null ? blockSourceIds[errorCommandIndex] : null;
  const visibleToolbox = visibleToolboxCommands(level);
  const availableDirections = directionCommandsForLevel(level);
  const currentLevelNumber = levelRegistry.findIndex((entry) => entry.id === level.id) + 1;

  useEffect(() => {
    setCurrentLevel(level.id as LevelId);
    setBlocks([]);
    setMessage('');
    setPlayer(level.player);
    setItems(level.items);
    setStars(0);
    setFinalStars(0);
    setFinalCommandCount(0);
    setShowResult(false);
    setStepCommands([]);
    setStepIndex(0);
    setActiveCommandIndex(null);
    setCompletedCommandCount(0);
    setErrorCommandIndex(null);
    setHintIndex(0);
    setEditorMode('blocks');
    setManualCode('');
    setSelectedDirection(directionCommandsForLevel(level)[0]?.command || 'move_right');
  }, [level, setCurrentLevel]);

  useEffect(() => {
    engine.setOnComplete((cmdCount: number) => {
      const earned = calculateStars(level, true, cmdCount);
      useProgress.getState().recordCompletion(level.id as LevelId, cmdCount, earned);
      setFinalStars(earned);
      setFinalCommandCount(cmdCount);
      setStars(earned);
      setShowResult(true);
    });
  }, [engine, level]);

  const addBlock = (command: string) => {
    setBlocks((current) => {
      if (command === 'start' && current.some((block) => block.command === 'start')) {
        setMessage('START blogu calisma alaninda zaten var.');
        return current;
      }

      const nextBlock = createWorkspaceBlock(command, current.length);
      if (command === 'if_else' && !blockCommandsForLevel(level).includes('pick_item')) {
        nextBlock.condition = 'obstacle_ahead()';
        nextBlock.thenChildren = [];
      }
      return [...current, nextBlock];
    });
    clearExecutionState();
  };

  const createBlockForDrop = (command: string): WorkspaceBlock | null => {
    if (!blockCommandsForLevel(level).includes(command)) return null;
    const nextBlock = createWorkspaceBlock(command, blocks.length);
    if (command === 'if_else' && !blockCommandsForLevel(level).includes('pick_item')) {
      nextBlock.condition = 'obstacle_ahead()';
      nextBlock.thenChildren = [];
    }
    return nextBlock;
  };

  const updateBlock = (index: number, patch: Partial<WorkspaceBlock>) => {
    setBlocks((current) => current.map((block, blockIndex) => (
      blockIndex === index ? { ...block, ...patch } : block
    )));
    clearExecutionState();
  };

  const cloneBlocksForMove = (current: WorkspaceBlock[]): WorkspaceBlock[] => current.map((block) => ({
    ...block,
    children: block.children ? [...block.children] : block.children,
    bodyChildren: block.bodyChildren ? [...block.bodyChildren] : block.bodyChildren,
    thenChildren: block.thenChildren ? [...block.thenChildren] : block.thenChildren,
    elseChildren: block.elseChildren ? [...block.elseChildren] : block.elseChildren,
  }));

  const resolveContainer = (
    current: WorkspaceBlock[],
    containerId: string,
  ): { children: WorkspaceBlock[]; setChildren?: (children: WorkspaceBlock[]) => void } | null => {
    if (containerId === ROOT_CONTAINER_ID) {
      return {
        children: current,
        setChildren: (children) => {
          current.splice(0, current.length, ...children);
        },
      };
    }

    const slot = parseSlotContainerId(containerId);
    if (slot) {
      const parent = current.find((block) => block.id === slot.blockId);
      if (!parent) return null;
      const key = slotChildrenKey(slot.slot);
      const children = parent[key] ?? [];
      return {
        children,
        setChildren: (nextChildren) => {
          parent[key] = nextChildren;
        },
      };
    }

    const repeatParent = current.find((block) => block.id === containerId && block.command === 'repeat');
    if (!repeatParent) return null;
    const children = repeatParent.children ?? [];
    return {
      children,
      setChildren: (nextChildren) => {
        repeatParent.children = nextChildren;
      },
    };
  };

  const updateNestedBlock = (containerId: string, blockId: string, patch: Partial<WorkspaceBlock>) => {
    setBlocks((current) => {
      const next = cloneBlocksForMove(current);
      const container = resolveContainer(next, containerId);
      if (!container) return current;
      const children = container.children.map((child) => (
        child.id === blockId ? { ...child, ...patch } : child
      ));
      container.setChildren?.(children);
      return next;
    });
    clearExecutionState();
  };

  const removeNestedBlock = (containerId: string, blockId: string) => {
    setBlocks((current) => {
      const next = cloneBlocksForMove(current);
      const container = resolveContainer(next, containerId);
      if (!container) return current;
      container.setChildren?.(container.children.filter((child) => child.id !== blockId));
      return next;
    });
    clearExecutionState();
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    setBlocks((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      const block = next[index];
      next[index] = next[nextIndex];
      next[nextIndex] = block;
      return next;
    });
    clearExecutionState();
  };

  const reorderBlock = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setBlocks((current) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= current.length ||
        toIndex >= current.length
      ) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    clearExecutionState();
  };

  const moveBlockBetweenContainers = (source: DragSource, targetContainerId: string, targetIndex: number) => {
    setBlocks((current) => {
      const next = cloneBlocksForMove(current);
      const targetSlot = parseSlotContainerId(targetContainerId);
      let moved: WorkspaceBlock | undefined;

      if (source.containerId === TOOLBOX_CONTAINER_ID) {
        moved = createBlockForDrop(source.blockId) ?? undefined;
        if (moved?.command === 'start' && next.some((block) => block.command === 'start')) return current;
      } else {
        const sourceContainer = resolveContainer(next, source.containerId);
        if (!sourceContainer) return current;
        const childIndex = sourceContainer.children.findIndex((child) => child.id === source.blockId);
        if (childIndex === -1) return current;
        const sourceChildren = [...sourceContainer.children];
        [moved] = sourceChildren.splice(childIndex, 1);
        sourceContainer.setChildren?.(sourceChildren);
      }

      if (!moved) return current;
      if (targetContainerId !== ROOT_CONTAINER_ID && moved.command === 'start') return current;
      if (targetContainerId === moved.id || targetSlot?.blockId === moved.id) return current;
      if (targetSlot?.slot === 'body' && !isActionBlock(moved.command)) return current;
      if ((targetSlot?.slot === 'then' || targetSlot?.slot === 'else') && !isActionBlock(moved.command)) return current;

      const targetContainer = resolveContainer(next, targetContainerId);
      if (!targetContainer) return current;
      const children = [...targetContainer.children];
      const originalIndex = source.containerId === TOOLBOX_CONTAINER_ID ? -1 : source.index;
      const adjustedTargetIndex = source.containerId === targetContainerId && originalIndex < targetIndex
        ? targetIndex - 1
        : targetIndex;
      const insertionIndex = Math.max(0, Math.min(adjustedTargetIndex, children.length));
      children.splice(insertionIndex, 0, moved);
      targetContainer.setChildren?.(children);
      return next;
    });
    clearExecutionState();
  };

  const deleteDroppedBlock = (source: DragSource) => {
    if (source.containerId === TOOLBOX_CONTAINER_ID) return;

    setBlocks((current) => {
      const next = cloneBlocksForMove(current);
      const sourceContainer = resolveContainer(next, source.containerId);
      if (!sourceContainer) return current;
      const children = sourceContainer.children.filter((child) => child.id !== source.blockId);
      sourceContainer.setChildren?.(children);
      return next;
    });
    clearExecutionState();
    setMessage('Blok palete geri birakildi ve silindi.');
  };

  const handleToolboxDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const source = parseDragSource(event);
    if (source) deleteDroppedBlock(source);
    finishDrag();
  };

  const parseDragSource = (event: DragEvent<HTMLElement>): DragSource | null => {
    try {
      const raw = event.dataTransfer.getData('application/x-narva-block') || event.dataTransfer.getData('text/plain');
      const parsed = JSON.parse(raw) as DragSource;
      if (!parsed || typeof parsed.containerId !== 'string' || typeof parsed.blockId !== 'string') return null;
      return parsed;
    } catch {
      const index = Number(event.dataTransfer.getData('text/plain'));
      if (!Number.isInteger(index)) return null;
      return { containerId: ROOT_CONTAINER_ID, blockId: blocks[index]?.id || '', index };
    }
  };

  const finishDrag = () => {
    dragSourceRef.current = null;
    touchDragSourceRef.current = null;
    document.body.classList.remove(WORKSPACE_DRAGGING_CLASS);
    setDraggingBlockId(null);
    setDragSourceContainerId(null);
    setDropTargetKey(null);
  };

  const handleDragStart = (event: DragEvent<HTMLElement>, source: DragSource) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-narva-block', JSON.stringify(source));
    event.dataTransfer.setData('text/plain', JSON.stringify(source));
    dragSourceRef.current = source;
    document.body.classList.toggle(WORKSPACE_DRAGGING_CLASS, source.containerId !== TOOLBOX_CONTAINER_ID);
    setDraggingBlockId(source.blockId);
    setDragSourceContainerId(source.containerId);
    setDropTargetKey(`${source.containerId}:${source.index}`);
  };

  const handleDrop = (event: DragEvent<HTMLElement>, targetContainerId: string, toIndex: number) => {
    event.preventDefault();
    event.stopPropagation();
    const source = parseDragSource(event);
    if (source) moveBlockBetweenContainers(source, targetContainerId, toIndex);
    finishDrag();
  };

  const handlePointerDragStart = (event: PointerEvent<HTMLLIElement>, source: DragSource) => {
    if (event.pointerType === 'mouse') return;

    const target = event.target as HTMLElement;
    if (target.closest('button, input, select')) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    touchDragSourceRef.current = source;
    document.body.classList.toggle(WORKSPACE_DRAGGING_CLASS, source.containerId !== TOOLBOX_CONTAINER_ID);
    setDraggingBlockId(source.blockId);
    setDragSourceContainerId(source.containerId);
    setDropTargetKey(`${source.containerId}:${source.index}`);
  };

  const handlePointerDragMove = (event: PointerEvent<HTMLLIElement>) => {
    const source = touchDragSourceRef.current;
    if (source === null || source.containerId !== ROOT_CONTAINER_ID) return;

    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>('[data-block-index]');
    if (!target) return;

    const toIndex = Number(target.dataset.blockIndex);
    if (!Number.isInteger(toIndex) || toIndex === source.index) return;

    reorderBlock(source.index, toIndex);
    touchDragSourceRef.current = { ...source, index: toIndex };
    setDropTargetKey(`${ROOT_CONTAINER_ID}:${toIndex}`);
  };

  const removeBlock = (index: number) => {
    setBlocks((current) => current.filter((_, blockIndex) => blockIndex !== index));
    clearExecutionState();
  };

  const clearBlocks = () => {
    setBlocks([]);
    clearExecutionState();
    setMessage('Calisma alani temizlendi. Blok havuzundan yeni komutlar ekleyebilirsin.');
  };

  const clearExecutionState = () => {
    setStepCommands([]);
    setStepIndex(0);
    setActiveCommandIndex(null);
    setCompletedCommandCount(0);
    setErrorCommandIndex(null);
  };

  const switchEditorMode = (mode: EditorMode) => {
    if (mode === 'code' && !manualCode.trim()) {
      setManualCode(blockCode);
    }
    setEditorMode(mode);
    clearExecutionState();
  };

  const resetLevel = () => {
    engine.reset(level);
    setBlocks([]);
    setManualCode('');
    setEditorMode('blocks');
    setPlayer(level.player);
    setItems(level.items);
    setStars(0);
    setMessage('');
    setFinalStars(0);
    setFinalCommandCount(0);
    setShowResult(false);
    clearExecutionState();
  };

  const validateStartBlock = (): string | null => {
    if (editorMode === 'code') return null;
    const startIndexes = blocks
      .map((block, index) => (block.command === 'start' ? index : -1))
      .filter((index) => index >= 0);
    if (startIndexes.length === 0) return 'Once START blogunu calisma alanina ekle.';
    if (startIndexes.length > 1) return 'START blogu bir kez kullanilabilir.';
    if (startIndexes[0] !== 0) return 'START blogu calisma alaninin en ustunde olmali.';
    return null;
  };

  const runCode = async () => {
    engine.reset(level);
    setPlayer(level.player);
    setItems(level.items);
    const startError = validateStartBlock();
    if (startError) {
      setMessage(startError);
      return;
    }
    const compiled = compileCommandsForLevel(activeCode, level);
    const commands = compiled.commands;
    setShowResult(false);
    clearExecutionState();
    setMessage('');

    if (compiled.error) {
      setMessage(compiled.error);
      return;
    }

    for (const [index, command] of commands.entries()) {
      setActiveCommandIndex(index);
      await wait(160);
      const ok = await engine.execute(command);
      setPlayer({ ...engine.stateData.player });
      setItems([...engine.stateData.items]);
      if (!ok) {
        setErrorCommandIndex(index);
        setMessage(`Blok ${index + 1}: ${failureMessage(engine.stateData.lastError, command, level)}`);
        return;
      }
      setCompletedCommandCount(index + 1);
    }

    const completed = engine.checkGoal();
    const earnedStars = calculateStars(level, completed, engine.stateData.commandCount);
    setPlayer({ ...engine.stateData.player });
    setItems([...engine.stateData.items]);
    setStars(earnedStars);
    setActiveCommandIndex(null);

    if (completed) {
      setMessage(`Basardin. ${earnedStars} yildiz kazandin.`);
    } else {
      setMessage(`Robot hedefe ulasamadi. Ipucu: ${levelHint(level, hintIndex)}`);
    }
  };

  const runNextStep = async () => {
    const startError = validateStartBlock();
    if (startError) {
      setMessage(startError);
      return;
    }
    const compiled = stepCommands.length ? null : compileCommandsForLevel(activeCode, level);
    const commands = stepCommands.length ? stepCommands : compiled?.commands ?? [];
    const currentIndex = stepCommands.length ? stepIndex : 0;
    const command = commands[currentIndex];

    if (compiled?.error) {
      setMessage(compiled.error);
      return;
    }

    if (!command) {
      setMessage(`Calisacak komut kalmadi. Ipucu: ${levelHint(level, hintIndex)}`);
      setActiveCommandIndex(null);
      return;
    }

    if (!stepCommands.length) {
      engine.reset(level);
      setPlayer(level.player);
      setItems(level.items);
      setShowResult(false);
      setStars(0);
      setStepCommands(commands);
      setStepIndex(0);
      setCompletedCommandCount(0);
      setErrorCommandIndex(null);
    }

    setActiveCommandIndex(currentIndex);
    setErrorCommandIndex(null);
    const ok = await engine.execute(command);
    setPlayer({ ...engine.stateData.player });
    setItems([...engine.stateData.items]);

    if (!ok) {
      setErrorCommandIndex(currentIndex);
      setMessage(`Blok ${currentIndex + 1}: ${failureMessage(engine.stateData.lastError, command, level)}`);
      return;
    }

    const nextIndex = currentIndex + 1;
    setStepIndex(nextIndex);
    setCompletedCommandCount(nextIndex);

    if (engine.checkGoal()) {
      setMessage('Hedefe ulastin. Sonuc paneli acildi.');
      setActiveCommandIndex(null);
      return;
    }

    if (nextIndex >= commands.length) {
      setMessage(`Komutlar bitti ama robot hedefe ulasamadi. Ipucu: ${levelHint(level, hintIndex)}`);
      setActiveCommandIndex(null);
      return;
    }

    setActiveCommandIndex(nextIndex);
    setMessage(`${commandLabel(command)} calisti. Siradaki komuta gec.`);
  };

  const stepButtonLabel = stepCommands.length ? 'Sonraki Adim' : 'Adim Adim';
  const stepProgressLabel = stepCommands.length
    ? `${Math.min(stepIndex, stepCommands.length)} / ${stepCommands.length}`
    : `${visibleCommands.length} komut`;
  const isDraggingFromWorkspace = draggingBlockId !== null && dragSourceContainerId !== null && dragSourceContainerId !== TOOLBOX_CONTAINER_ID;
  const isTrashTargetActive = isDraggingFromWorkspace && dropTargetKey === TOOLBOX_CONTAINER_ID;

  const handleRetry = () => {
    resetLevel();
  };

  const handleNext = () => {
    const nextId = getNextLevelId(level.id);
    if (nextId) {
      router.push(`/level/${nextId}`);
    } else {
      router.push('/world-map');
    }
    setShowResult(false);
  };

  const renderNestedBlocks = (
    containerId: string,
    children: WorkspaceBlock[] | undefined,
    emptyText: string,
  ) => {
    const items = children ?? [];

    return (
      <div className="nested-slot">
        {items.length === 0 ? (
          <p
            className="nested-empty nested-drop-zone"
            onDragEnter={(event) => {
              event.stopPropagation();
              setDropTargetKey(`${containerId}:0`);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleDrop(event, containerId, 0)}
          >
            {emptyText}
          </p>
        ) : (
          <div className="nested-items">
            {items.map((item, itemIndex) => {
              const itemMeta = COMMAND_META[item.command] || { label: item.command, shortLabel: item.command, symbol: item.command, color: '#2989ff' };
              return (
                <div
                  key={item.id}
                  draggable
                  className={[
                    'nested-item',
                    activeSourceId === item.id ? 'active' : '',
                    completedSourceIds.has(item.id) ? 'done' : '',
                    errorSourceId === item.id ? 'error' : '',
                    draggingBlockId === item.id ? 'dragging' : '',
                    dropTargetKey === `${containerId}:${itemIndex}` && draggingBlockId !== null ? 'drop-target' : '',
                  ].filter(Boolean).join(' ')}
                  style={{ '--block-color': itemMeta.color } as CSSProperties}
                  onDragStart={(event) => {
                    event.stopPropagation();
                    handleDragStart(event, { containerId, blockId: item.id, index: itemIndex });
                  }}
                  onDragEnter={(event) => {
                    event.stopPropagation();
                    setDropTargetKey(`${containerId}:${itemIndex}`);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, containerId, itemIndex)}
                  onDragEnd={(event) => {
                    event.stopPropagation();
                    finishDrag();
                  }}
                >
                  <span>{itemMeta.shortLabel}</span>
                  {DIRECTION_COMMANDS.includes(item.command) && (
                    <label>
                      adim
                      <select
                        value={item.stepArg || '1'}
                        onChange={(event) => updateNestedBlock(containerId, item.id, { stepArg: event.target.value })}
                        aria-label={`${itemMeta.label} adim sayisi`}
                      >
                        {STEP_ARG_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              );
            })}
            <div
              className="nested-drop-zone nested-end-zone"
              onDragEnter={(event) => {
                event.stopPropagation();
                setDropTargetKey(`${containerId}:${items.length}`);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, containerId, items.length)}
            >
              Buraya birak
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="level-page">
      <div className="level-layout">
        <aside className="code-panel">
          <h2>{editorMode === 'code' ? 'Kod Editoru' : 'Blok Editoru'}</h2>
          <div className="editor-mode-tabs" aria-label="Editor modu">
            <button
              type="button"
              className={editorMode === 'code' ? 'active' : ''}
              aria-pressed={editorMode === 'code'}
              onClick={() => switchEditorMode('code')}
            >
              Kod Modu
            </button>
            <button
              type="button"
              className={editorMode === 'blocks' ? 'active' : ''}
              aria-pressed={editorMode === 'blocks'}
              onClick={() => switchEditorMode('blocks')}
            >
              Blok Modu
            </button>
          </div>
          {editorMode === 'blocks' ? (
            <>
              <div className="block-mode-shell">
                <div
                  className={[
                    'block-toolbox-panel',
                    isDraggingFromWorkspace ? 'trash-ready' : '',
                    isTrashTargetActive ? 'trash-active' : '',
                  ].filter(Boolean).join(' ')}
                  aria-label="Kullanilacak bloklar"
                  onDragEnter={(event) => {
                    if (!isDraggingFromWorkspace) return;
                    event.preventDefault();
                    setDropTargetKey(TOOLBOX_CONTAINER_ID);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleToolboxDrop}
                >
                  <strong>Kullanilacak Bloklar</strong>
                  <div className="toolbox-trash-target" aria-hidden="true">
                    <span className="toolbox-trash-icon">
                      <span />
                    </span>
                    <strong>Silmek icin buraya birak</strong>
                  </div>
                  {availableDirections.length > 0 && (
                    <div className="direction-picker" aria-label="Yon blogu">
                      <label htmlFor="direction-command">Yon</label>
                      <select
                        id="direction-command"
                        value={selectedDirection}
                        onChange={(event) => setSelectedDirection(event.target.value)}
                      >
                        {availableDirections.map((option) => (
                          <option key={option.command} value={option.command}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        draggable
                        style={{ '--block-color': COMMAND_META[selectedDirection]?.color || '#2989ff' } as CSSProperties}
                        onClick={() => addBlock(selectedDirection)}
                        onDragStart={(event) => handleDragStart(event, {
                          containerId: TOOLBOX_CONTAINER_ID,
                          blockId: selectedDirection,
                          index: -1,
                        })}
                        onDragEnd={finishDrag}
                        aria-label={`${COMMAND_META[selectedDirection]?.label || 'Yon'} blogu ekle`}
                        title={`${COMMAND_META[selectedDirection]?.label || 'Yon'} blogu ekle`}
                      >
                        <span className="toolbox-symbol" aria-hidden="true">
                          {DIRECTION_OPTIONS.find((option) => option.command === selectedDirection)?.symbol || '->'}
                        </span>
                        <span className="toolbox-label">Git</span>
                      </button>
                    </div>
                  )}
                  <div className="block-toolbox">
                    {visibleToolbox.map((command) => {
                      if (command === 'start' && blocks.some((block) => block.command === 'start')) return null;
                      const meta = COMMAND_META[command] || { label: command, shortLabel: command, symbol: command, color: '#2989ff' };
                      return (
                        <button
                          key={command}
                          type="button"
                          draggable
                          style={{ '--block-color': meta.color } as CSSProperties}
                          onClick={() => addBlock(command)}
                          onDragStart={(event) => handleDragStart(event, {
                            containerId: TOOLBOX_CONTAINER_ID,
                            blockId: command,
                            index: -1,
                          })}
                          onDragEnd={finishDrag}
                          aria-label={meta.label}
                          title={meta.label}
                        >
                          <span className="toolbox-symbol" aria-hidden="true">{meta.symbol}</span>
                          <span className="toolbox-label">{meta.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div
                  className="block-workspace"
                  aria-label="Calisma alani"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, ROOT_CONTAINER_ID, blocks.length)}
                >
                <div className="block-workspace-header">
                  <strong>Calisma Alani</strong>
                  <button type="button" onClick={clearBlocks}>Temizle</button>
                </div>
                {blocks.length === 0 ? (
                  <p className="empty-workspace">Soldaki bloklardan START blogunu ve komutlari sec.</p>
                ) : (
                  <ol className="workspace-block-list">
                    {blocks.map((block, index) => {
                      const meta = COMMAND_META[block.command] || { label: block.command, shortLabel: block.command, symbol: block.command, color: '#2989ff' };
                      return (
                        <li
                          key={block.id}
                          data-block-index={index}
                          draggable
                          className={[
                            'workspace-block',
                            activeSourceId === block.id ? 'active' : '',
                            completedSourceIds.has(block.id) ? 'done' : '',
                            (
                              errorSourceId === block.id ||
                              (
                                ['repeat', 'assignment', 'operator'].includes(block.command) &&
                                blockContainsSourceId(block, errorSourceId)
                              )
                            ) ? 'error' : '',
                            draggingBlockId === block.id ? 'dragging' : '',
                            dropTargetKey === `${ROOT_CONTAINER_ID}:${index}` && draggingBlockId !== null ? 'drop-target' : '',
                          ].filter(Boolean).join(' ')}
                          style={{ '--block-color': meta.color } as CSSProperties}
                          onDragStart={(event) => handleDragStart(event, { containerId: ROOT_CONTAINER_ID, blockId: block.id, index })}
                          onDragEnter={() => setDropTargetKey(`${ROOT_CONTAINER_ID}:${index}`)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => handleDrop(event, ROOT_CONTAINER_ID, index)}
                          onDragEnd={finishDrag}
                          onPointerDown={(event) => handlePointerDragStart(event, { containerId: ROOT_CONTAINER_ID, blockId: block.id, index })}
                          onPointerMove={handlePointerDragMove}
                          onPointerUp={finishDrag}
                          onPointerCancel={finishDrag}
                          aria-label={`${index + 1}. blok: ${meta.label}`}
                        >
                          <span className="block-grip" aria-hidden="true">{index + 1}</span>
                          <span className="block-label">{meta.shortLabel}</span>
                          {block.command === 'repeat' && (
                            <div className="repeat-config repeat-loop" aria-label="Tekrar ayarlari">
                              <div className="repeat-loop-head">
                                <div className="repeat-steps-config" aria-label="Dongu adim degiskeni">
                                  <input
                                    value={block.variableName ?? 'steps'}
                                    onChange={(event) => updateBlock(index, { variableName: event.target.value })}
                                    aria-label="Dongu degisken adi"
                                  />
                                  <span>=</span>
                                  <input
                                    value={block.expression ?? '1 + 2'}
                                    onChange={(event) => updateBlock(index, { expression: event.target.value })}
                                    aria-label="Dongu degisken degeri"
                                  />
                                </div>
                              </div>
                              {renderNestedBlocks(block.id, block.children, 'Bir blogu buraya surukle.')}
                            </div>
                          )}
                          {block.command === 'if_obstacle_ahead' && (
                            <div className="repeat-config condition-block" aria-label="Kosul ayarlari">
                              <div className="repeat-loop-head">
                                <span>eger</span>
                                <small>onunde engel varsa</small>
                              </div>
                              {block.conditionCommand ? (
                                <div
                                  className="repeat-item"
                                  style={{ '--block-color': COMMAND_META[block.conditionCommand].color } as CSSProperties}
                                >
                                  <span>{COMMAND_META[block.conditionCommand].shortLabel}</span>
                                  <small>calistir</small>
                                  <button type="button" onClick={() => updateBlock(index, { conditionCommand: undefined })}>Sil</button>
                                </div>
                              ) : (
                                <p className="repeat-empty">Kosul icin bir yon bloguna tikla.</p>
                              )}
                            </div>
                          )}
                          {DIRECTION_COMMANDS.includes(block.command) && (
                            <div className="movement-config" aria-label="Hareket ayarlari">
                              <label>
                                adim
                                <select
                                  value={block.stepArg || '1'}
                                  onChange={(event) => updateBlock(index, { stepArg: event.target.value })}
                                  aria-label={`${meta.label} adim sayisi`}
                                >
                                  {STEP_ARG_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          )}
                          {(block.command === 'assignment' || block.command === 'operator') && (
                            <div className="dsl-block-config" aria-label="Degisken ayarlari">
                              <div className="dsl-config">
                                <input
                                  value={block.variableName ?? 'steps'}
                                  onChange={(event) => updateBlock(index, { variableName: event.target.value })}
                                  aria-label="Degisken adi"
                                />
                                <span>=</span>
                                <input
                                  value={block.expression ?? (block.command === 'operator' ? '1 + 2' : '3')}
                                  onChange={(event) => updateBlock(index, { expression: event.target.value })}
                                  aria-label="Degisken degeri"
                                />
                              </div>
                              <div className="block-nest block-nest-body">
                                <div className="block-nest-label">sonra yap</div>
                                {renderNestedBlocks(
                                  slotContainerId(block.id, 'body'),
                                  block.bodyChildren,
                                  'Hareket veya Al blogunu buraya surukle.',
                                )}
                              </div>
                            </div>
                          )}
                          {block.command === 'if_else' && (
                            <div className="if-block-config" aria-label="If else ayarlari">
                              <label>
                                if
                                <select
                                  value={block.condition || 'item_here()'}
                                  onChange={(event) => updateBlock(index, { condition: event.target.value })}
                                  aria-label="If kosulu"
                                >
                                  {CONDITION_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                  ))}
                                </select>
                              </label>
                              <div className="if-branch">
                                <div className="block-nest-label">calistir</div>
                                {renderNestedBlocks(
                                  slotContainerId(block.id, 'then'),
                                  block.thenChildren,
                                  'Kosul dogruysa calisacak blogu buraya surukle.',
                                )}
                              </div>
                              <div className="if-branch if-branch-else">
                                <div className="block-nest-label">degilse</div>
                                {renderNestedBlocks(
                                  slotContainerId(block.id, 'else'),
                                  block.elseChildren,
                                  'Kosul yanlissa calisacak blogu buraya surukle.',
                                )}
                              </div>
                            </div>
                          )}
                          {block.command === 'while' && (
                            <div className="dsl-config dsl-container" aria-label="While ayarlari">
                              <label>
                                basla
                                <input
                                  type="number"
                                  min={1}
                                  max={MAX_REPEAT_COUNT}
                                  value={block.loopCount || 3}
                                  onChange={(event) => updateBlock(index, { loopCount: clampRepeatCount(Number(event.target.value) || 1) })}
                                  aria-label="Baslangic sayisi"
                                />
                              </label>
                              <label>
                                while
                                <input
                                  value={block.condition || 'steps > 0'}
                                  onChange={(event) => updateBlock(index, { condition: event.target.value })}
                                  aria-label="While kosulu"
                                />
                              </label>
                              <label>
                                yap
                                <select
                                  value={block.bodyCommand || 'move_right'}
                                  onChange={(event) => updateBlock(index, { bodyCommand: event.target.value })}
                                  aria-label="While komutu"
                                >
                                  {DIRECTION_COMMANDS.map((command) => (
                                    <option key={command} value={command}>{COMMAND_META[command].shortLabel}</option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          )}
                          {block.command === 'for_range' && (
                            <div className="dsl-config dsl-container" aria-label="For range ayarlari">
                              <label>
                                range
                                <input
                                  type="number"
                                  min={1}
                                  max={MAX_REPEAT_COUNT}
                                  value={block.loopCount || 3}
                                  onChange={(event) => updateBlock(index, { loopCount: clampRepeatCount(Number(event.target.value) || 1) })}
                                  aria-label="For tekrar sayisi"
                                />
                              </label>
                              <label>
                                yap
                                <select
                                  value={block.bodyCommand || 'move_right'}
                                  onChange={(event) => updateBlock(index, { bodyCommand: event.target.value })}
                                  aria-label="For komutu"
                                >
                                  {DIRECTION_COMMANDS.map((command) => (
                                    <option key={command} value={command}>{COMMAND_META[command].shortLabel}</option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          )}
                          {block.command === 'match_case' && (
                            <div className="dsl-config dsl-container" aria-label="Match case ayarlari">
                              <label>
                                route
                                <select
                                  value={block.matchValue || '"right"'}
                                  onChange={(event) => updateBlock(index, { matchValue: event.target.value })}
                                  aria-label="Match degeri"
                                >
                                  <option value="&quot;right&quot;">right</option>
                                  <option value="&quot;up&quot;">up</option>
                                </select>
                              </label>
                              <label>
                                case right
                                <select
                                  value={block.caseCommand || 'move_right'}
                                  onChange={(event) => updateBlock(index, { caseCommand: event.target.value })}
                                  aria-label="Case komutu"
                                >
                                  {DIRECTION_COMMANDS.map((command) => (
                                    <option key={command} value={command}>{COMMAND_META[command].shortLabel}</option>
                                  ))}
                                </select>
                              </label>
                              <label>
                                case _
                                <select
                                  value={block.defaultCommand || 'move_up'}
                                  onChange={(event) => updateBlock(index, { defaultCommand: event.target.value })}
                                  aria-label="Default komutu"
                                >
                                  {DIRECTION_COMMANDS.map((command) => (
                                    <option key={command} value={command}>{COMMAND_META[command].shortLabel}</option>
                                  ))}
                                </select>
                              </label>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
                </div>
              </div>
              <label htmlFor="code">Uretilen Kod</label>
              <textarea id="code" value={blockCode} readOnly rows={7} />
            </>
          ) : (
            <div className="manual-code-editor">
              <label htmlFor="manual-code">Kod Modu</label>
              <textarea
                id="manual-code"
                value={manualCode}
                onChange={(event) => {
                  setManualCode(event.target.value);
                  clearExecutionState();
                }}
                rows={16}
                spellCheck={false}
                placeholder={'move_right()\nmove_up()\nrepeat(3): move_right\nif obstacle_ahead(): move_up'}
              />
            </div>
          )}
          <section className="control-panel" aria-label="Kod kontrolleri">
            <div className="control-panel-header">
              <span>Kod Kontrolleri</span>
              <strong>{stepProgressLabel}</strong>
            </div>
            <div className="control-primary-row">
              <Button className="control-button control-run" onClick={runCode}>
                <span aria-hidden="true">▶</span>
                Calistir
              </Button>
              <Button className="control-button control-step" onClick={runNextStep}>
                <span aria-hidden="true">↷</span>
                {stepButtonLabel}
              </Button>
            </div>
            <div className="control-secondary-row">
              <Button className="control-button control-hint" onClick={() => {
                const nextHintIndex = hintIndex + 1;
                setHintIndex(nextHintIndex);
                setMessage(`Ipucu: ${levelHint(level, nextHintIndex)}`);
              }}>
                <span aria-hidden="true">?</span>
                Ipucu
              </Button>
              <Button className="control-button control-reset" onClick={resetLevel}>
                <span aria-hidden="true">↺</span>
                Reset
              </Button>
              <Button className="control-button control-map" onClick={() => router.push('/world-map')}>
                <span aria-hidden="true">⌂</span>
                Harita
              </Button>
            </div>
          </section>
        </aside>

        <div className="level-content">
      <section className="task-card" aria-label="Gorev karti">
        <div className="task-card-main">
          <div className="task-card-topline">
            <span className="level-world">{WORLD_META[level.world as WorldId]?.title || 'Narva Dunyasi'}</span>
            <div className="level-stars" aria-label={`${stars} yildiz`}>
              {Array.from({ length: 3 }).map((_, index) => (
                <span key={index} className={index < stars ? 'earned' : ''}>*</span>
              ))}
            </div>
          </div>
          <h1>{level.title}</h1>
          <h2>{level.learningOutcome}</h2>
          <div className="curriculum-status" aria-label="Mufredat durumu">
            <span>Seviye {currentLevelNumber} / {levelRegistry.length}</span>
            <strong>{conceptLabel(level.concept)}</strong>
          </div>
        </div>
        <div className="task-facts" aria-label="Gorev bilgileri">
          <div className="task-fact">
            <span>Baslangic</span>
            <strong>
              {level.player.x + 1},{level.player.y + 1} - {directionLabel(level.player.direction)}
            </strong>
          </div>
          <div className="task-fact">
            <span>Hedef</span>
            <strong>{level.goal.x + 1},{level.goal.y + 1} karesi</strong>
          </div>
          <div className="task-fact">
            <span>Engel</span>
            <strong>{level.obstacles.length ? `${level.obstacles.length} engel` : 'yok'}</strong>
          </div>
        </div>
        <div className="task-blocks" aria-label="Bu seviyede kullanilabilecek bloklar">
          {availableDirections.length > 0 && (
            <span
              className="task-block-icon"
              aria-label="Yon sec"
              title="Yon sec"
              style={{ '--block-color': '#2989ff' } as CSSProperties}
            >
              ↕
            </span>
          )}
          {visibleToolbox.map((command) => {
            const meta = COMMAND_META[command] || { label: command, shortLabel: command, symbol: command, color: '#2989ff' };
            return (
              <span
                className="task-block-icon"
                key={command}
                aria-label={meta.shortLabel}
                title={meta.shortLabel}
                style={{ '--block-color': meta.color } as CSSProperties}
              >
                {meta.symbol}
              </span>
            );
          })}
        </div>
        <p className="task-hint">Ipucu: {levelHint(level)}</p>
      </section>

      <section className="game-area">
        <div className="board-panel">
          <svg viewBox={`0 0 ${level.grid.cols} ${level.grid.rows}`} className="game-board" role="img">
            <defs>
              <linearGradient id="tileGradient" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#fff8cc" />
                <stop offset="100%" stopColor="#d6f5ff" />
              </linearGradient>
              <radialGradient id="robotGradient">
                <stop offset="0%" stopColor="#8ef5ff" />
                <stop offset="100%" stopColor="#4b6bff" />
              </radialGradient>
            </defs>
            {Array.from({ length: level.grid.rows }).map((_, y) =>
              Array.from({ length: level.grid.cols }).map((__, x) => (
                <rect key={`${x}-${y}`} x={x + 0.04} y={y + 0.04} width="0.92" height="0.92" rx="0.12" fill="url(#tileGradient)" stroke="#ffffff" strokeWidth="0.05" />
              ))
            )}
            {level.obstacles.map((obstacle) => (
              <g key={`${obstacle.x}-${obstacle.y}`}>
                <rect x={obstacle.x + 0.1} y={obstacle.y + 0.1} width="0.8" height="0.8" rx="0.12" fill="#7d5cff" />
                <text x={obstacle.x + 0.5} y={obstacle.y + 0.63} fontSize="0.42" textAnchor="middle" fill="#fff">!</text>
              </g>
            ))}
            {items.map((item) => (
              <g key={`${item.type}-${item.x}-${item.y}`} aria-label={`${item.type} nesnesi`}>
                <circle cx={item.x + 0.5} cy={item.y + 0.5} r="0.22" fill="#ffcf5a" stroke="#ffffff" strokeWidth="0.06" />
                <path
                  d={`M ${item.x + 0.38} ${item.y + 0.48} C ${item.x + 0.38} ${item.y + 0.32}, ${item.x + 0.62} ${item.y + 0.32}, ${item.x + 0.62} ${item.y + 0.48} C ${item.x + 0.62} ${item.y + 0.66}, ${item.x + 0.38} ${item.y + 0.66}, ${item.x + 0.38} ${item.y + 0.48} Z`}
                  fill="#ff7a1a"
                />
                <path d={`M ${item.x + 0.5} ${item.y + 0.31} L ${item.x + 0.58} ${item.y + 0.2}`} stroke="#2f9e44" strokeWidth="0.04" strokeLinecap="round" />
              </g>
            ))}
            <g aria-label="Varis noktasi">
              <path
                d={`M ${level.goal.x + 0.24} ${level.goal.y + 0.78} L ${level.goal.x + 0.24} ${level.goal.y + 0.44} C ${level.goal.x + 0.24} ${level.goal.y + 0.18}, ${level.goal.x + 0.76} ${level.goal.y + 0.18}, ${level.goal.x + 0.76} ${level.goal.y + 0.44} L ${level.goal.x + 0.76} ${level.goal.y + 0.78} Z`}
                fill="#32d17d"
                stroke="#ffffff"
                strokeWidth="0.06"
              />
              <path
                d={`M ${level.goal.x + 0.35} ${level.goal.y + 0.78} L ${level.goal.x + 0.35} ${level.goal.y + 0.46} C ${level.goal.x + 0.35} ${level.goal.y + 0.31}, ${level.goal.x + 0.65} ${level.goal.y + 0.31}, ${level.goal.x + 0.65} ${level.goal.y + 0.46} L ${level.goal.x + 0.65} ${level.goal.y + 0.78} Z`}
                fill="#d8fff0"
              />
              <circle cx={level.goal.x + 0.5} cy={level.goal.y + 0.56} r="0.08" fill="#ffcf5a" />
              <rect x={level.goal.x + 0.18} y={level.goal.y + 0.78} width="0.64" height="0.1" rx="0.04" fill="#178c55" />
            </g>
            <g>
              <circle cx={player.x + 0.5} cy={player.y + 0.5} r="0.34" fill="url(#robotGradient)" />
              <circle cx={player.x + 0.38} cy={player.y + 0.43} r="0.04" fill="#10233f" />
              <circle cx={player.x + 0.62} cy={player.y + 0.43} r="0.04" fill="#10233f" />
              <rect x={player.x + 0.35} y={player.y + 0.58} width="0.3" height="0.05" rx="0.03" fill="#10233f" />
            </g>
          </svg>
        </div>
      </section>
        </div>
      </div>
      {showResult && (
        <ResultPanel
          stars={finalStars}
          commandCount={finalCommandCount}
          bestCommandCount={level.starRules.threeStars.maxCommands}
          feedback={resultFeedback(finalStars, finalCommandCount, level.starRules.threeStars.maxCommands)}
          onRetry={handleRetry}
          onNext={handleNext}
        />
      )}
      {isRobotErrorMessage(message) && <FeedbackPopup message={message} onClose={() => setMessage('')} />}
    </main>
  );
}

function isRobotErrorMessage(message: string): boolean {
  if (!message) return false;
  return [
    'START',
    'Robot hedefe',
    'Komutlar bitti',
    'Calisacak komut',
    'Bu komut',
    'Dur!',
    'O yolda',
    'Burada alinacak',
    'Unknown command',
    'Bilinmeyen',
  ].some((prefix) => message.startsWith(prefix)) || /^Blok \d+:/.test(message);
}
