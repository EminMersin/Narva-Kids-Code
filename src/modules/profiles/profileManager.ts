import { LocalStorageHelper } from '@/storage/localStorageHelper/localStorageHelper';

export interface Profile {
  id?: string;
  nickname: string;
  avatar: string;
  ageRange: '6-8' | '8-10' | '10-12' | '12-16';
  experience: 'none' | 'some' | 'scratch' | 'python';
  mode: 'easy' | 'medium' | 'hard';
  createdAt: string;
  lastPlayedLevelId?: string;
}

const PROFILE_INDEX_KEY = 'narva_profile_ids';
const REQUIRED_FIELDS = ['nickname', 'avatar', 'ageRange', 'experience', 'mode'] as const;

function profileKey(id: string): string {
  return `profile_${id}`;
}

function readProfileIds(): string[] {
  return LocalStorageHelper.get<string[]>(PROFILE_INDEX_KEY) || [];
}

function writeProfileIds(ids: string[]): void {
  LocalStorageHelper.set(PROFILE_INDEX_KEY, Array.from(new Set(ids)));
}

export class ProfileManager {
  constructor(_storageType: 'indexedDB' | 'localStorage' = 'localStorage') {}

  async createProfile(profileData: Omit<Profile, 'id' | 'createdAt'>): Promise<Profile> {
    for (const field of REQUIRED_FIELDS) {
      if (!profileData[field]) {
        throw new Error(`Zorunlu alan eksik: ${field}`);
      }
    }

    const id = `prof_${Date.now()}`;
    const profile: Profile = {
      id,
      ...profileData,
      createdAt: new Date().toISOString(),
    };

    LocalStorageHelper.set(profileKey(id), profile);
    writeProfileIds([...readProfileIds(), id]);
    return profile;
  }

  async get(id: string): Promise<Profile | null> {
    return LocalStorageHelper.get<Profile>(profileKey(id));
  }

  async update(id: string, updates: Partial<Profile>): Promise<Profile> {
    const current = await this.get(id);
    if (!current) throw new Error(`Profil bulunamadi: ${id}`);

    const updated = { ...current, ...updates };
    LocalStorageHelper.set(profileKey(id), updated);
    return updated;
  }

  async remove(id: string): Promise<void> {
    LocalStorageHelper.remove(profileKey(id));
    writeProfileIds(readProfileIds().filter((profileId) => profileId !== id));
  }

  async list(): Promise<Profile[]> {
    return readProfileIds()
      .map((id) => LocalStorageHelper.get<Profile>(profileKey(id)))
      .filter((profile): profile is Profile => Boolean(profile));
  }

  async setLastPlayedLevelId(id: string, levelId: string): Promise<void> {
    await this.update(id, { lastPlayedLevelId: levelId });
  }
}
