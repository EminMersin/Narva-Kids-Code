import { existsSync, mkdirSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const dataRoot = join(root, 'data', 'levels');
const registryPath = join(root, 'src', 'modules', 'levels', 'registry.ts');

const worldTitles = {
  movement: 'Hareket ve Kod Girisi',
  sequence: 'Degiskenler ve Operatorler',
  conditions: 'If Else Kararlari',
  loops: 'While ve For Donguleri',
  matchcase: 'Match Case Secimleri',
  challenge: 'Mini Python Gorevleri',
};

const worldDescriptions = {
  movement: 'Komut, satir sirasi ve parametreli hareketleri ogrenir.',
  sequence: 'Degiskenleri, aritmetik ifadeleri ve karsilastirmalari kullanir.',
  conditions: 'If else ile karar vermeyi ogrenir.',
  loops: 'While ve for range ile tekrar eden kodlari yazar.',
  matchcase: 'Match case ile secime gore rota kurar.',
  challenge: 'Birden fazla Python fikrini ayni gorevde birlestirir.',
};

const modeTitles = {
  easy: 'Kolay',
  medium: 'Orta',
  hard: 'Zor',
};

const worldOrder = ['movement', 'sequence', 'conditions', 'loops', 'matchcase', 'challenge'];
const modeOrder = ['easy', 'medium', 'hard'];

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function writeJson(path, data) {
  ensureDir(join(path, '..'));
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function cleanupGeneratedLevels() {
  for (const world of readdirSync(dataRoot)) {
    const worldDir = join(dataRoot, world);
    if (world === 'movement') {
      for (const mode of readdirSync(worldDir)) {
        const modeDir = join(worldDir, mode);
        if (mode !== 'easy') {
          rmSync(modeDir, { recursive: true, force: true });
          continue;
        }
        for (const file of readdirSync(modeDir)) {
          if (!/^movement_easy_00[1-8]\.json$/.test(file)) {
            unlinkSync(join(modeDir, file));
          }
        }
      }
      continue;
    }
    rmSync(worldDir, { recursive: true, force: true });
  }
}

function commandLine(command) {
  if (command.includes('(')) return command;
  return `${command}()`;
}

function parseCommand(command) {
  const match = command.trim().match(/^([a-z_]+)(?:\((\d+)\))?$/);
  return {
    name: match?.[1] ?? command,
    steps: Number(match?.[2] ?? 1),
  };
}

function movePosition(position, command) {
  const parsed = parseCommand(command);
  let next = { ...position, direction: position.direction ?? 'right' };
  const directionByCommand = {
    move_right: 'right',
    move_left: 'left',
    move_up: 'up',
    move_down: 'down',
  };

  if (directionByCommand[parsed.name]) {
    next.direction = directionByCommand[parsed.name];
  }

  for (let index = 0; index < parsed.steps; index++) {
    if (parsed.name === 'move_forward' || next.direction === 'right') next = { ...next, x: next.x + 1 };
    if (next.direction === 'left' && parsed.name !== 'move_forward') next = { ...next, x: next.x - 1 };
    if (next.direction === 'up' && parsed.name !== 'move_forward') next = { ...next, y: next.y - 1 };
    if (next.direction === 'down' && parsed.name !== 'move_forward') next = { ...next, y: next.y + 1 };
  }

  return next;
}

function isBlockedAhead(position, obstacles) {
  const ahead = { x: position.x + 1, y: position.y };
  return obstacles.some((obstacle) => obstacle.x === ahead.x && obstacle.y === ahead.y);
}

function hasItemHere(position, items) {
  return items.some((item) => item.x === position.x && item.y === position.y);
}

function simulateCommand(position, command, obstacles, items = []) {
  const conditionMatch = command.match(/^if\s+(obstacle_ahead|item_here)\(\):\s*(.+?)(?:\s+else:\s*(.+))?$/);
  if (conditionMatch) {
    const shouldRun = conditionMatch[1] === 'obstacle_ahead'
      ? isBlockedAhead(position, obstacles)
      : hasItemHere(position, items);
    const selected = shouldRun ? conditionMatch[2] : conditionMatch[3];
    return selected ? simulateCommand(position, selected, obstacles, items) : position;
  }
  if (command.replace(/\(\)$/, '') === 'pick_item') {
    return position;
  }
  return movePosition(position, command);
}

function simulateRoute(player, commands, obstacles, items = []) {
  return commands.reduce((position, command) => simulateCommand(position, command, obstacles, items), { ...player });
}

function baseLevel({
  id,
  world,
  mode,
  order,
  title,
  concept,
  learningOutcome,
  childIntro,
  player,
  goal,
  obstacles,
  items = [],
  available,
  hints,
  solutionCommands,
  pythonCode,
}) {
  return {
    id,
    world,
    mode,
    order,
    title,
    concept,
    allowedSyntax: available.filter((command) => !command.startsWith('move_')),
    starterBlocks: [],
    requiredConcepts: [concept],
    maxLoopIterations: 24,
    learningOutcome,
    topicTags: [world, mode, concept],
    childIntro,
    grid: { rows: 5, cols: Math.max(5, Math.min(12, goal.x + 1)) },
    player,
    goal: { x: goal.x, y: goal.y, type: 'door' },
    obstacles,
    items,
    availableCommands: available,
    availableBlocks: available,
    successRules: {
      mustReachGoal: true,
      mustCollectItems: items.map((item) => item.type),
      requiredCommands: [],
      forbiddenCommands: [],
    },
    starRules: {
      oneStar: { mustComplete: true },
      twoStars: { maxCommands: Math.max(solutionCommands.length + 2, 2) },
      threeStars: { maxCommands: Math.max(solutionCommands.length, 1) },
    },
    hints,
    solution: {
      logic: childIntro,
      commands: solutionCommands,
      pythonCode,
    },
  };
}

function routeLevel({ world, mode, order, concept, title, learningOutcome, childIntro, pythonCode, solutionCommands, available, hints, obstacles = [], items = [] }) {
  const player = { x: 0, y: 2, direction: 'right' };
  const goal = simulateRoute(player, solutionCommands, obstacles, items);
  const maxObstacleX = obstacles.reduce((max, obstacle) => Math.max(max, obstacle.x), 0);
  return baseLevel({
    id: `${world}_${mode}_${String(order).padStart(3, '0')}`,
    world,
    mode,
    order,
    title: `${title} ${modeTitles[mode]} ${order}`,
    concept,
    learningOutcome,
    childIntro,
    player,
    goal: { ...goal, x: Math.max(goal.x, maxObstacleX + 1) },
    obstacles,
    items,
    available,
    hints,
    solutionCommands,
    pythonCode,
  });
}

function pattern(index, patterns) {
  return patterns[index % patterns.length];
}

function simpleRoute(index) {
  return pattern(index, [
    ['move_right', 'move_right', 'move_up', 'move_right'],
    ['move_up', 'move_right(2)', 'move_down', 'move_right'],
    ['move_right(2)', 'move_down', 'move_right', 'move_up'],
    ['move_up', 'move_up', 'move_right(2)', 'move_down', 'move_right'],
    ['move_right', 'move_down', 'move_right(2)', 'move_up'],
    ['move_right(3)', 'move_up', 'move_right'],
    ['move_up', 'move_right', 'move_down', 'move_right(2)'],
    ['move_right(2)', 'move_up', 'move_right(2)'],
  ]);
}

function movementLevel(mode, order, globalIndex) {
  const route = simpleRoute(globalIndex);
  const pythonCode = route.map(commandLine).join('\n');
  return routeLevel({
    world: 'movement',
    mode,
    order,
    concept: globalIndex < 6 ? 'python_intro' : 'parameterized_commands',
    title: globalIndex < 6 ? 'Python Satirlari' : 'Parametreli Komut',
    learningOutcome: globalIndex < 6
      ? 'Cocuk Python komutlarinin satir satir calistigini gorur.'
      : 'Cocuk komut parantezine sayi vererek daha kisa kod yazar.',
    childIntro: globalIndex < 6
      ? 'Kod Modu ve Blok Modu ayni hareketleri uretir. Satirlari yukaridan asagi takip et.'
      : 'Parantez icindeki sayi robotun kac kare gidecegini belirler.',
    pythonCode,
    solutionCommands: route,
    available: ['move_forward', 'move_up', 'move_right', 'move_left', 'move_down'],
    hints: ['Kod satirlari yukaridan asagi calisir.', 'Parantez icindeki sayi tekrar eden hareketi kisaltir.', 'Step modu hangi satirin calistigini gosterir.'],
  });
}

function sequenceLevel(mode, order, globalIndex) {
  const route = simpleRoute(globalIndex);
  const isVariable = globalIndex % 2 !== 0;
  const isOperator = !isVariable;
  const pythonCode = isVariable
    ? `steps = ${Math.max(2, parseCommand(route[0]).steps)}\n${route.slice(1).map(commandLine).join('\n')}\nmove_right(steps)`
    : `left_steps = 1 + ${globalIndex % 3 + 1}\nright_steps = left_steps + 1\nmove_right(left_steps)\nmove_up()\nmove_right(right_steps)`;
  const solutionCommands = isVariable
    ? [...route.slice(1), `move_right(${Math.max(2, parseCommand(route[0]).steps)})`]
    : [`move_right(${globalIndex % 3 + 2})`, 'move_up', `move_right(${globalIndex % 3 + 3})`];

  return routeLevel({
    world: 'sequence',
    mode,
    order,
    concept: isVariable ? 'variables' : 'operators',
    title: isVariable ? 'Degisken Kullan' : 'Operatorle Hesapla',
    learningOutcome: isVariable
      ? 'Cocuk bir sayiyi degiskende tutup komutta kullanir.'
      : 'Cocuk aritmetik operatorlerle hareket sayisini hesaplar.',
    childIntro: isVariable
      ? 'Degisken, sayiyi saklayan kucuk bir kutu gibidir.'
      : 'Operatorler sayilari birlestirir ve yeni hareket sayisi uretir.',
    pythonCode,
    solutionCommands,
    available: ['assignment', 'operator', 'move_forward', 'move_up', 'move_right', 'move_left', 'move_down'],
    hints: ['Degisken adini komutun icinde kullanabilirsin.', '+ ve - operatorleri hareket sayisini hesaplar.', 'Once degisken satiri calisir, sonra komutlar.'],
  });
}

function conditionLevel(mode, order, globalIndex) {
  const useObstacle = globalIndex % 2 === 0;
  const obstacles = useObstacle ? [{ x: 1, y: 2, type: 'wall' }] : [];
  const item = useObstacle
    ? { x: 1, y: 1, type: 'carrot' }
    : { x: 1, y: 2, type: 'carrot' };
  const tail = 2 + (globalIndex % 4);
  const pythonCode = useObstacle
    ? `if obstacle_ahead():\n  move_up()\nelse:\n  move_right()\nmove_right()\nif item_here():\n  pick_item()\nelse:\n  move_right()\nmove_right(${tail})`
    : `move_right()\nif item_here():\n  pick_item()\nelse:\n  move_up()\nmove_right(${tail})`;
  const solutionCommands = useObstacle
    ? [`if obstacle_ahead(): move_up else: move_right`, 'move_right', 'if item_here(): pick_item else: move_right', `move_right(${tail})`]
    : ['move_right', 'if item_here(): pick_item else: move_up', `move_right(${tail})`];

  return routeLevel({
    world: 'conditions',
    mode,
    order,
    concept: 'if_else',
    title: 'If Else Karari',
    learningOutcome: 'Cocuk if else ile kosula gore farkli komut calistirir.',
    childIntro: 'Kosul dogruysa if blogu, degilse else blogu calisir.',
    pythonCode,
    solutionCommands,
    obstacles,
    items: [item],
    available: ['assignment', 'operator', 'if_else', 'if_obstacle_ahead', 'pick_item', 'move_forward', 'move_up', 'move_right', 'move_left', 'move_down'],
    hints: ['If blogu once soruyu sorar.', 'Nesnenin uzerindeysen Topla komutunu calistir.', 'Else blogu kosul yanlissa calisir.'],
  });
}

function loopLevel(mode, order, globalIndex) {
  const isWhile = globalIndex % 2 === 0;
  const count = 2 + (globalIndex % 5);
  const pythonCode = isWhile
    ? `steps = ${count}\nwhile steps > 0:\n  move_right()\n  steps = steps - 1`
    : `for i in range(${count}):\n  move_right()\nmove_up()\nfor i in range(2):\n  move_right()`;
  const solutionCommands = isWhile
    ? Array.from({ length: count }, () => 'move_right')
    : [...Array.from({ length: count }, () => 'move_right'), 'move_up', 'move_right', 'move_right'];

  return routeLevel({
    world: 'loops',
    mode,
    order,
    concept: isWhile ? 'while' : 'for_range',
    title: isWhile ? 'While Sayaci' : 'For Range',
    learningOutcome: isWhile
      ? 'Cocuk while dongusunu sayac azaltilarak guvenli kullanir.'
      : 'Cocuk for range ile belli sayida tekrar eder.',
    childIntro: isWhile
      ? 'While kosul dogru oldugu surece calisir; sayaci azaltmayi unutma.'
      : 'For range, kac tekrar yapilacagini bastan bilir.',
    pythonCode,
    solutionCommands,
    available: ['assignment', 'operator', 'while', 'for_range', 'move_forward', 'move_up', 'move_right', 'move_left', 'move_down'],
    hints: ['While icinde sayaci degistir.', 'For range tekrar sayisini parantezden alir.', 'Donguler tekrar eden kodu kisaltir.'],
  });
}

function matchLevel(mode, order, globalIndex) {
  const selected = ['right', 'up', 'down'][globalIndex % 3];
  const commandByCase = {
    right: 'move_right(3)',
    up: 'move_up',
    down: 'move_down',
  };
  const pythonCode = `route = "${selected}"\nmatch route:\n  case "right":\n    move_right(3)\n  case "up":\n    move_up()\n  case "down":\n    move_down()\n  case _:\n    move_right()\nmove_right(2)`;
  const solutionCommands = [commandByCase[selected], 'move_right(2)'];

  return routeLevel({
    world: 'matchcase',
    mode,
    order,
    concept: 'match_case',
    title: 'Match Case Secimi',
    learningOutcome: 'Cocuk match case ile degerin hangi yola gidecegini secer.',
    childIntro: 'Match bir degeri kontrol eder ve uygun case blogunu calistirir.',
    pythonCode,
    solutionCommands,
    available: ['assignment', 'match_case', 'move_forward', 'move_up', 'move_right', 'move_left', 'move_down'],
    hints: ['Match degeri case satirlariyla karsilastirir.', 'case _ hicbiri uymazsa calisir.', 'Secilen case sadece kendi icindeki komutu calistirir.'],
  });
}

function challengeLevel(mode, order, globalIndex) {
  const count = 2 + (globalIndex % 4);
  const pythonCode = `steps = ${count}\nfor i in range(steps):\n  move_right()\nif steps > 3:\n  move_up()\nelse:\n  move_down()\nroute = "finish"\nmatch route:\n  case "finish":\n    move_right(2)\n  case _:\n    move_left()`;
  const solutionCommands = [
    ...Array.from({ length: count }, () => 'move_right'),
    count > 3 ? 'move_up' : 'move_down',
    'move_right(2)',
  ];

  return routeLevel({
    world: 'challenge',
    mode,
    order,
    concept: 'mini_challenge',
    title: 'Python Mini Gorev',
    learningOutcome: 'Cocuk degisken, operator, if else, for ve match case kavramlarini birlestirir.',
    childIntro: 'Bu gorevde birden fazla Python fikrini ayni rotada kullan.',
    pythonCode,
    solutionCommands,
    available: ['assignment', 'operator', 'if_else', 'for_range', 'match_case', 'move_forward', 'move_up', 'move_right', 'move_left', 'move_down'],
    hints: ['Once for dongusunu oku.', 'If else hangi yonde devam edecegini secer.', 'Match case son hareketi belirler.'],
  });
}

function addGeneratedLevel(generated, level) {
  const path = join(dataRoot, level.world, level.mode, `${level.id}.json`);
  writeJson(path, level);
  generated.push(path);
}

function generateLevels() {
  cleanupGeneratedLevels();
  const generated = [];
  let global = 0;

  for (let order = 1; order <= 2; order++) {
    addGeneratedLevel(generated, movementLevel('medium', order, global++));
  }

  const sequenceCounts = { easy: 8, medium: 8, hard: 8 };
  for (const mode of modeOrder) {
    for (let order = 1; order <= sequenceCounts[mode]; order++) {
      addGeneratedLevel(generated, sequenceLevel(mode, order, global++));
    }
  }

  const conditionCounts = { easy: 10, medium: 8, hard: 8 };
  for (const mode of modeOrder) {
    for (let order = 1; order <= conditionCounts[mode]; order++) {
      addGeneratedLevel(generated, conditionLevel(mode, order, global++));
    }
  }

  const loopCounts = { easy: 14, medium: 13, hard: 13 };
  for (const mode of modeOrder) {
    for (let order = 1; order <= loopCounts[mode]; order++) {
      addGeneratedLevel(generated, loopLevel(mode, order, global++));
    }
  }

  const matchCounts = { easy: 6, medium: 6, hard: 6 };
  for (const mode of modeOrder) {
    for (let order = 1; order <= matchCounts[mode]; order++) {
      addGeneratedLevel(generated, matchLevel(mode, order, global++));
    }
  }

  const challengeCounts = { easy: 1, medium: 1, hard: 0 };
  for (const mode of modeOrder) {
    for (let order = 1; order <= challengeCounts[mode]; order++) {
      addGeneratedLevel(generated, challengeLevel(mode, order, global++));
    }
  }

  return generated;
}

function collectLevelFiles() {
  const files = [];
  for (const world of worldOrder) {
    const worldDir = join(dataRoot, world);
    if (!existsSync(worldDir)) continue;
    for (const mode of modeOrder) {
      const modeDir = join(worldDir, mode);
      if (!existsSync(modeDir)) continue;
      for (const file of readdirSync(modeDir).filter((name) => name.endsWith('.json')).sort()) {
        files.push(join(modeDir, file));
      }
    }
  }
  return files;
}

function writeRegistry(files) {
  const imports = files.map((file, index) => {
    const importPath = relative(join(root, 'src', 'modules', 'levels'), file).replaceAll('\\', '/');
    return `import level${index} from '${importPath.startsWith('.') ? importPath : `./${importPath}`}';`;
  });

  const entries = files.map((_, index) => `  level${index} as LevelData,`);
  const worldIdType = worldOrder.map((world) => `'${world}'`).join(' | ');
  const worldMeta = worldOrder
    .map((world, index) => `  ${world}: { id: '${world}', title: '${worldTitles[world]}', description: '${worldDescriptions[world]}', order: ${index + 1} },`)
    .join('\n');

  const content = `import type { LevelData, LevelMode } from './schema';\n${imports.join('\n')}\n\nexport type WorldId = ${worldIdType};\nexport type LevelId = string;\n\nexport interface WorldMeta {\n  id: WorldId;\n  title: string;\n  description: string;\n  order: number;\n}\n\nexport interface LevelRegistryEntry {\n  id: LevelId;\n  world: WorldId;\n  mode: LevelMode;\n  order: number;\n  title: string;\n  levelData: LevelData;\n}\n\nexport const WORLD_ORDER: WorldId[] = ${JSON.stringify(worldOrder)};\nexport const MODE_ORDER: LevelMode[] = ${JSON.stringify(modeOrder)};\n\nexport const WORLD_META: Record<WorldId, WorldMeta> = {\n${worldMeta}\n};\n\nconst LEVEL_DATA: LevelData[] = [\n${entries.join('\n')}\n];\n\nfunction compareLevels(a: LevelData, b: LevelData): number {\n  const worldDiff = WORLD_ORDER.indexOf(a.world as WorldId) - WORLD_ORDER.indexOf(b.world as WorldId);\n  if (worldDiff !== 0) return worldDiff;\n  const modeDiff = MODE_ORDER.indexOf(a.mode) - MODE_ORDER.indexOf(b.mode);\n  if (modeDiff !== 0) return modeDiff;\n  return a.order - b.order;\n}\n\nexport const levelRegistry: LevelRegistryEntry[] = LEVEL_DATA\n  .slice()\n  .sort(compareLevels)\n  .map((level) => ({\n    id: level.id,\n    world: level.world as WorldId,\n    mode: level.mode,\n    order: level.order,\n    title: level.title,\n    levelData: level,\n  }));\n\nexport const allLevelIds: LevelId[] = levelRegistry.map((entry) => entry.id);\n\nexport function getWorlds(): WorldMeta[] {\n  return WORLD_ORDER.map((worldId) => WORLD_META[worldId]);\n}\n\nexport function getLevelById(id: string): LevelData | null {\n  return levelRegistry.find((entry) => entry.id === id)?.levelData ?? null;\n}\n\nexport function getLevelsByWorld(world: WorldId): LevelRegistryEntry[] {\n  return levelRegistry.filter((entry) => entry.world === world);\n}\n\nexport function getLevelsByWorldAndMode(world: WorldId, mode: LevelMode): LevelRegistryEntry[] {\n  return levelRegistry.filter((entry) => entry.world === world && entry.mode === mode);\n}\n\nexport function getNextLevelId(id: string): LevelId | null {\n  const index = allLevelIds.indexOf(id);\n  return index >= 0 && index < allLevelIds.length - 1 ? allLevelIds[index + 1] : null;\n}\n\nexport function getPreviousLevelId(id: string): LevelId | null {\n  const index = allLevelIds.indexOf(id);\n  return index > 0 ? allLevelIds[index - 1] : null;\n}\n\nexport function getFirstLevelId(): LevelId {\n  return allLevelIds[0];\n}\n`;
  writeFileSync(registryPath, content);
}

generateLevels();
writeRegistry(collectLevelFiles());
