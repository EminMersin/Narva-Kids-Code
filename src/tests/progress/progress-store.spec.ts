import { describe, expect, test, beforeEach } from 'vitest';
import { useProgress } from '../../store/progress';

describe('Progress store', () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
        clear: () => storage.clear(),
      },
    });
    useProgress.setState({
      completedLevels: {},
      currentLevel: 'movement_easy_001',
      hydrated: true,
    });
  });

  test('keeps the best stars and best command count after repeated completions', () => {
    const store = useProgress.getState();

    store.recordCompletion('movement_easy_001', 5, 2);
    useProgress.getState().recordCompletion('movement_easy_001', 8, 1);

    expect(useProgress.getState().completedLevels.movement_easy_001).toMatchObject({
      completed: true,
      stars: 2,
      commandCount: 5,
    });

    useProgress.getState().recordCompletion('movement_easy_001', 3, 3);

    expect(useProgress.getState().completedLevels.movement_easy_001).toMatchObject({
      completed: true,
      stars: 3,
      commandCount: 3,
    });
  });

  test('moves current level to the next level after completion', () => {
    useProgress.getState().recordCompletion('movement_easy_001', 3, 3);

    expect(useProgress.getState().currentLevel).toBe('movement_easy_002');
  });

  test('does not wipe stored completions when current level is set before hydration', () => {
    localStorage.setItem('narva_progress', JSON.stringify({
      completedLevels: {
        movement_easy_001: { completed: true, stars: 3, commandCount: 2 },
      },
      currentLevel: 'movement_easy_002',
    }));
    useProgress.setState({
      completedLevels: {},
      currentLevel: 'movement_easy_001',
      hydrated: false,
    });

    useProgress.getState().setCurrentLevel('movement_easy_005');

    expect(useProgress.getState().completedLevels.movement_easy_001).toMatchObject({
      completed: true,
      stars: 3,
      commandCount: 2,
    });
    expect(JSON.parse(localStorage.getItem('narva_progress') || '{}').completedLevels.movement_easy_001).toMatchObject({
      completed: true,
      stars: 3,
      commandCount: 2,
    });
  });
});
