import { useEffect } from 'react';
import {
  MODE_ORDER,
  getLevelsByWorld,
  getWorlds,
  type LevelId,
  type TrackId,
  type WorldId,
} from '@/modules/levels/registry';
import { useProgress } from '@/store/progress';

export type LevelState = 'locked' | 'open' | 'completed';
export type WorldState = 'locked' | 'open' | 'completed';

export interface LevelInfo {
  id: LevelId;
  order: number;
  title: string;
  mode: string;
  state: LevelState;
  stars: number;
}

export interface WorldInfo {
  id: WorldId;
  track: TrackId;
  title: string;
  description: string;
  state: WorldState;
  levels: LevelInfo[];
  completedCount: number;
  totalStars: number;
  nextOpenLevelId: LevelId | null;
}

export default function useWorldMap(): {
  worlds: WorldInfo[];
  completedCount: number;
  totalStars: number;
  nextOpenLevelId: LevelId;
} {
  const completedLevels = useProgress((state) => state.completedLevels);
  const currentLevel = useProgress((state) => state.currentLevel);
  const hydrate = useProgress((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const worlds = getWorlds().map((world, worldIndex): WorldInfo => {
    const sameTrackWorlds = getWorlds().filter((candidate) => candidate.track === world.track);
    const sameTrackIndex = sameTrackWorlds.findIndex((candidate) => candidate.id === world.id);
    const previousWorld = sameTrackWorlds[sameTrackIndex - 1];
    const previousWorldLevels = previousWorld ? getLevelsByWorld(previousWorld.id) : [];
    const previousWorldCompleted = previousWorldLevels.length
      ? previousWorldLevels.every((entry) => completedLevels[entry.id]?.completed)
      : true;
    const worldLocked = sameTrackIndex > 0 && !previousWorldCompleted;

    const orderedLevels = getLevelsByWorld(world.id).slice().sort((a, b) => {
      const modeDiff = MODE_ORDER.indexOf(a.mode) - MODE_ORDER.indexOf(b.mode);
      if (modeDiff !== 0) return modeDiff;
      return a.order - b.order;
    });

    const levels = orderedLevels.map((entry, index): LevelInfo => {
      const completed = completedLevels[entry.id];
      const previousEntry = orderedLevels[index - 1];
      const previousCompleted = previousEntry ? completedLevels[previousEntry.id]?.completed : true;
      const state: LevelState = completed?.completed
        ? 'completed'
        : !worldLocked && (index === 0 || previousCompleted)
          ? 'open'
          : 'locked';

      return {
        id: entry.id,
        order: index + 1,
        title: entry.title,
        mode: entry.mode,
        state,
        stars: completed?.stars ?? 0,
      };
    });

    const completedCount = levels.filter((level) => level.state === 'completed').length;
    const nextOpen = levels.find((level) => level.state === 'open');

    return {
      id: world.id,
      track: world.track,
      title: world.title,
      description: world.description,
      state: worldLocked ? 'locked' : completedCount === levels.length ? 'completed' : 'open',
      levels,
      completedCount,
      totalStars: levels.reduce((sum, level) => sum + level.stars, 0),
      nextOpenLevelId: nextOpen?.id ?? null,
    };
  });

  const nextOpen = worlds.flatMap((world) => world.levels).find((level) => level.state === 'open');

  return {
    worlds,
    completedCount: worlds.reduce((sum, world) => sum + world.completedCount, 0),
    totalStars: worlds.reduce((sum, world) => sum + world.totalStars, 0),
    nextOpenLevelId: nextOpen?.id || currentLevel,
  };
}
