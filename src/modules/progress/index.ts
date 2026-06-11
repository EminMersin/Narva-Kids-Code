import { LocalStorageHelper } from '@/storage/localStorageHelper/localStorageHelper';

export interface ProgressData {
  profileId: string;
  levelId: string;
  completed: boolean;
  stars: number;
  bestCommandCount: number;
  lastSuccessfulSolution: {
    source: 'blocks' | 'code';
    pythonCode: string;
    commands: string[];
  };
  createdAt: string;
  updatedAt: string;
}

const PROGRESS_INDEX_KEY = 'narva_progress_keys';

function progressKey(profileId: string, levelId: string): string {
  return `progress_${profileId}_${levelId}`;
}

function readProgressKeys(): string[] {
  return LocalStorageHelper.get<string[]>(PROGRESS_INDEX_KEY) || [];
}

function writeProgressKeys(keys: string[]): void {
  LocalStorageHelper.set(PROGRESS_INDEX_KEY, Array.from(new Set(keys)));
}

export class ProgressTracker {
  async saveProgress(data: Omit<ProgressData, 'createdAt' | 'updatedAt'>): Promise<ProgressData> {
    const key = progressKey(data.profileId, data.levelId);
    const existing = LocalStorageHelper.get<ProgressData>(key);
    const now = new Date().toISOString();
    const progressData: ProgressData = {
      ...existing,
      ...data,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    LocalStorageHelper.set(key, progressData);
    writeProgressKeys([...readProgressKeys(), key]);
    return progressData;
  }

  async getProgress(profileId: string, levelId: string): Promise<ProgressData | null> {
    return LocalStorageHelper.get<ProgressData>(progressKey(profileId, levelId));
  }

  async getAllProgress(profileId: string): Promise<ProgressData[]> {
    return readProgressKeys()
      .filter((key) => key.startsWith(`progress_${profileId}_`))
      .map((key) => LocalStorageHelper.get<ProgressData>(key))
      .filter((progress): progress is ProgressData => Boolean(progress));
  }

  async updateProgress(profileId: string, levelId: string, updates: Partial<ProgressData>): Promise<ProgressData> {
    const current = await this.getProgress(profileId, levelId);
    if (!current) throw new Error(`Progress not found for ${profileId}/${levelId}`);

    return this.saveProgress({
      ...current,
      ...updates,
      profileId,
      levelId,
    });
  }

  async removeProgress(profileId: string, levelId: string): Promise<void> {
    const key = progressKey(profileId, levelId);
    LocalStorageHelper.remove(key);
    writeProgressKeys(readProgressKeys().filter((progressKeyValue) => progressKeyValue !== key));
  }
}
