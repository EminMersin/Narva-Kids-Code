'use client';

import { useEffect, useMemo, useState } from 'react';
import { GameEngine } from '@/modules/game/engine';
import { compileCode } from '@/modules/interpreter';
import { isWebLevel, LevelSchema, type LevelData, type RobotLevelData, type WebLevelData } from '@/modules/levels/schema';
import {
  MODE_ORDER,
  WORLD_META,
  getLevelsByWorldAndMode,
  getWorlds,
  levelRegistry,
  type WorldId,
} from '@/modules/levels/registry';
import { renderWebPreview, validateWebLevel } from '@/modules/web/engine';

interface SolutionResult {
  compiled: boolean;
  completed: boolean;
  commandCount: number;
  errors: string[];
}

function calculateStars(level: LevelData, completed: boolean, commandCount: number): number {
  if (!completed) return 0;
  if (commandCount <= level.starRules.threeStars.maxCommands) return 3;
  if (commandCount <= level.starRules.twoStars.maxCommands) return 2;
  return 1;
}

async function runSolution(level: LevelData): Promise<SolutionResult> {
  if (isWebLevel(level)) return runWebSolution(level);
  return runRobotSolution(level);
}

async function runRobotSolution(level: RobotLevelData): Promise<SolutionResult> {
  const compiled = compileCode(level.solution.pythonCode, level.availableCommands);
  if (!compiled.success) {
    return {
      compiled: false,
      completed: false,
      commandCount: 0,
      errors: [compiled.error],
    };
  }

  const engine = new GameEngine(level);
  const errors: string[] = [];
  for (const command of compiled.commands) {
    const ok = await engine.execute(command);
    if (!ok) {
      errors.push(`${command}: ${engine.stateData.lastError?.reason || 'failed'}`);
      break;
    }
  }

  const completed = engine.checkGoal();
  if (!completed) errors.push('Solution does not reach goal.');

  return {
    compiled: true,
    completed,
    commandCount: engine.stateData.commandCount,
    errors,
  };
}

function runWebSolution(level: WebLevelData): SolutionResult {
  const result = validateWebLevel(level, level.solution.document);
  return {
    compiled: true,
    completed: result.completed,
    commandCount: result.commandCount,
    errors: result.errors,
  };
}

export default function LevelPreviewPage() {
  const first = levelRegistry[0];
  const [world, setWorld] = useState<WorldId>(first.world);
  const [mode, setMode] = useState(first.mode);
  const [levelId, setLevelId] = useState(first.id);
  const [solution, setSolution] = useState<SolutionResult | null>(null);

  const levels = useMemo(() => getLevelsByWorldAndMode(world, mode), [world, mode]);
  const level = levels.find((entry) => entry.id === levelId)?.levelData || levels[0]?.levelData || first.levelData;
  const schema = LevelSchema.safeParse(level);
  const stars = solution ? calculateStars(level, solution.completed, solution.commandCount) : 0;

  useEffect(() => {
    const nextLevels = getLevelsByWorldAndMode(world, mode);
    if (!nextLevels.some((entry) => entry.id === levelId) && nextLevels[0]) {
      setLevelId(nextLevels[0].id);
    }
  }, [world, mode, levelId]);

  useEffect(() => {
    let active = true;
    setSolution(null);
    void runSolution(level).then((result) => {
      if (active) setSolution(result);
    });
    return () => {
      active = false;
    };
  }, [level]);

  return (
    <main className="preview-page">
      <header className="world-map-header">
        <div>
          <span className="level-world">Internal QA</span>
          <h1>Level Preview</h1>
          <p>Level verisi, validasyon ve örnek çözüm sonucunu tek ekranda kontrol et.</p>
        </div>
      </header>

      <section className="preview-controls" aria-label="Preview filtreleri">
        <label>
          Dünya
          <select value={world} onChange={(event) => setWorld(event.target.value as WorldId)}>
            {getWorlds().map((worldMeta) => (
              <option key={worldMeta.id} value={worldMeta.id}>{worldMeta.title}</option>
            ))}
          </select>
        </label>
        <label>
          Mod
          <select value={mode} onChange={(event) => setMode(event.target.value as typeof mode)}>
            {MODE_ORDER.map((modeValue) => (
              <option key={modeValue} value={modeValue}>{modeValue}</option>
            ))}
          </select>
        </label>
        <label>
          Level
          <select value={level.id} onChange={(event) => setLevelId(event.target.value)}>
            {levels.map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.order}. {entry.title}</option>
            ))}
          </select>
        </label>
      </section>

      <section className="preview-summary">
        <h2>{level.title}</h2>
        <p>{WORLD_META[level.world as WorldId]?.title} / {level.mode} / {level.id}</p>
        <div className="preview-status">
          <span className={schema.success ? '' : 'fail'}>Schema: {schema.success ? 'OK' : 'Hata'}</span>
          <span className={solution?.compiled ? '' : 'fail'}>Compile: {solution?.compiled ? 'OK' : 'Bekliyor'}</span>
          <span className={solution?.completed ? '' : 'fail'}>Solution: {solution?.completed ? 'Tamamlanır' : 'Kontrol'}</span>
          <span>Yıldız: {stars}</span>
          <span>Komut: {solution?.commandCount ?? '-'}</span>
        </div>
        {!schema.success && <p className="level-message">{schema.error.issues.join(' ')}</p>}
        {solution?.errors.length ? <p className="level-message">{solution.errors.join(' ')}</p> : null}
      </section>

      <section className="preview-grid">
        {isWebLevel(level) ? <WebPreview level={level} /> : <RobotPreview level={level} />}
        <pre className="preview-json">{JSON.stringify(level, null, 2)}</pre>
      </section>
    </main>
  );
}

function WebPreview({ level }: { level: WebLevelData }) {
  const title = findTitleText(level.solution.document) || level.web.titleText || 'Başlıksız Sayfa';

  return (
    <div className="web-preview-panel preview-web-panel">
      <div className="web-preview-toolbar">
        <span>Web Preview</span>
        <strong>Sekme: {title}</strong>
      </div>
      <iframe title="Web level preview" sandbox="" srcDoc={renderWebPreview(level.solution.document)} />
    </div>
  );
}

function findTitleText(nodes: WebLevelData['solution']['document']): string | null {
  for (const node of nodes) {
    if (node.tag === 'title') return node.text?.trim() || null;
    const found = findTitleText(node.children ?? []);
    if (found) return found;
  }
  return null;
}

function RobotPreview({ level }: { level: RobotLevelData }) {
  return (
    <div className="board-panel">
      <svg viewBox={`0 0 ${level.grid.cols} ${level.grid.rows}`} className="game-board" role="img">
        {Array.from({ length: level.grid.rows }).map((_, y) =>
          Array.from({ length: level.grid.cols }).map((__, x) => (
            <rect key={`${x}-${y}`} x={x + 0.04} y={y + 0.04} width="0.92" height="0.92" rx="0.12" fill="#d6f5ff" stroke="#ffffff" strokeWidth="0.05" />
          ))
        )}
        {level.obstacles.map((obstacle) => (
          <rect key={`${obstacle.x}-${obstacle.y}`} x={obstacle.x + 0.1} y={obstacle.y + 0.1} width="0.8" height="0.8" rx="0.12" fill="#7d5cff" />
        ))}
        <path
          d={`M ${level.goal.x + 0.24} ${level.goal.y + 0.78} L ${level.goal.x + 0.24} ${level.goal.y + 0.44} C ${level.goal.x + 0.24} ${level.goal.y + 0.18}, ${level.goal.x + 0.76} ${level.goal.y + 0.18}, ${level.goal.x + 0.76} ${level.goal.y + 0.44} L ${level.goal.x + 0.76} ${level.goal.y + 0.78} Z`}
          fill="#32d17d"
          stroke="#ffffff"
          strokeWidth="0.06"
        />
        <circle cx={level.goal.x + 0.5} cy={level.goal.y + 0.56} r="0.08" fill="#ffcf5a" />
        <circle cx={level.player.x + 0.5} cy={level.player.y + 0.5} r="0.34" fill="#4b6bff" />
      </svg>
    </div>
  );
}
