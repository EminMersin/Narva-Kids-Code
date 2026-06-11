import { create } from 'zustand';
import { allLevelIds, getFirstLevelId, getNextLevelId } from '../modules/levels/registry';

export type LevelId = string;

type Completed = {
  completed: true;
  stars: number;
  commandCount: number;
};

interface ProgressState {
  completedLevels: Partial<Record<LevelId, Completed>>;
  currentLevel: LevelId;
  hydrated: boolean;
  hydrate: () => void;
  setCurrentLevel: (id: LevelId) => void;
  recordCompletion: (levelId: LevelId, commandCount: number, stars: number) => void;
  isLevelCompleted: (id: LevelId) => boolean;
  getStars: (id: LevelId) => number;
  nextLevelId: (levelId?: LevelId) => LevelId | null;
}

const STORAGE_KEY = 'narva_progress';
type PersistedProgress = Pick<ProgressState, 'completedLevels' | 'currentLevel'>;

function persist(state: PersistedProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage may be unavailable during SSR/tests.
  }
}

function readPersisted(): PersistedProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedProgress>;
    return {
      completedLevels: parsed.completedLevels || {},
      currentLevel: parsed.currentLevel || getFirstLevelId(),
    };
  } catch {
    return null;
  }
}

function getPersistableState(state: ProgressState): PersistedProgress {
  if (state.hydrated) {
    return {
      completedLevels: state.completedLevels,
      currentLevel: state.currentLevel,
    };
  }

  return readPersisted() || {
    completedLevels: state.completedLevels,
    currentLevel: state.currentLevel,
  };
}

export const useProgress = create<ProgressState>((set, get) => ({
  completedLevels: {},
  currentLevel: getFirstLevelId(),
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;

    const persisted = readPersisted();
    if (persisted) {
      set({
        ...persisted,
        hydrated: true,
      });
      return;
    }

    set({ hydrated: true });
  },

  setCurrentLevel: (id) => {
    const current = getPersistableState(get());
    const next = { completedLevels: current.completedLevels, currentLevel: id };
    set({ ...next, hydrated: true });
    persist(next);
  },

  recordCompletion: (levelId, commandCount, stars) => {
    const current = getPersistableState(get());
    const existing = current.completedLevels[levelId];
    const bestStars = Math.max(existing?.stars ?? 0, stars);
    const bestCommandCount = existing
      ? Math.min(existing.commandCount, commandCount)
      : commandCount;
    const completedLevels = {
      ...current.completedLevels,
      [levelId]: { completed: true as const, stars: bestStars, commandCount: bestCommandCount },
    };
    const currentLevel = getNextLevelId(levelId) || levelId;

    set({ completedLevels, currentLevel, hydrated: true });
    persist({ completedLevels, currentLevel });
  },

  isLevelCompleted: (id) => Boolean(get().completedLevels[id]?.completed),

  getStars: (id) => get().completedLevels[id]?.stars ?? 0,

  nextLevelId: (levelId) => getNextLevelId(levelId || get().currentLevel),
}));

export const levelIds = allLevelIds;
