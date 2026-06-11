import { LocalStorageHelper } from '@/storage/localStorageHelper/localStorageHelper';

export class ProgressManager {
  saveProgress(
    profileId: string,
    levelId: string,
    stars: number,
    commandsUsed: number,
    success: boolean
  ): void {
    LocalStorageHelper.set(`progress_${profileId}_${levelId}`, {
      profileId,
      levelId,
      stars,
      commandsUsed,
      success,
      timestamp: new Date().toISOString(),
    });
  }

  getProgress(profileId: string, levelId: string): unknown {
    return LocalStorageHelper.get(`progress_${profileId}_${levelId}`);
  }

  evaluatePerformance(commandsUsed: number): number {
    if (commandsUsed <= 3) return 3;
    if (commandsUsed <= 5) return 2;
    return 1;
  }
}
