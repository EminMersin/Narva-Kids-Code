'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { ProfileManager, type Profile } from '@/modules/profiles/profileManager';

type ProfileDraft = Pick<Profile, 'nickname' | 'avatar' | 'ageRange' | 'experience'>;

const avatarOptions = [
  { value: 'robot', label: 'Robot' },
  { value: 'explorer', label: 'Kasif' },
  { value: 'astronaut', label: 'Astronot' },
  { value: 'narva', label: 'Narva Bot' },
];

function recommendMode(ageRange: Profile['ageRange'], experience: Profile['experience']): Profile['mode'] {
  if (experience === 'python') return 'hard';
  if (ageRange === '6-8') return 'easy';
  if (ageRange === '8-10') return experience === 'none' ? 'easy' : 'medium';
  if (ageRange === '10-12') return 'medium';
  return 'hard';
}

export default function OnboardingPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileDraft>({
    nickname: '',
    avatar: 'robot',
    ageRange: '6-8',
    experience: 'none',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const manager = new ProfileManager();
      const created = await manager.createProfile({
        ...profile,
        mode: recommendMode(profile.ageRange, profile.experience),
      });
      localStorage.setItem('narva_profile_id', created.id || '');
      router.push('/world-map');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profil olusturulamadi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="onboarding-container">
      <h1>Narva Kids Code</h1>
      <p>Baslamak icin cocuk profilini olustur.</p>

      <form onSubmit={handleSubmit} className="onboarding-form">
        <div className="avatar-section">
          <Avatar src={profile.avatar} size={96} />
          <fieldset className="avatar-picker">
            <legend>Avatar</legend>
            <div>
              {avatarOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={profile.avatar === option.value ? 'selected' : ''}
                  onClick={() => setProfile({ ...profile, avatar: option.value })}
                  aria-pressed={profile.avatar === option.value}
                >
                  <Avatar src={option.value} size={42} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <label>
          Nickname
          <input
            type="text"
            value={profile.nickname}
            onChange={(event: { target: { value: string } }) => setProfile({ ...profile, nickname: event.target.value })}
            required
          />
        </label>

        <label>
          Yas araligi
          <select
            value={profile.ageRange}
            onChange={(event: { target: { value: string } }) => setProfile({ ...profile, ageRange: event.target.value as Profile['ageRange'] })}
          >
            <option value="6-8">6-8</option>
            <option value="8-10">8-10</option>
            <option value="10-12">10-12</option>
            <option value="12-16">12-16</option>
          </select>
        </label>

        <label>
          Kodlama deneyimi
          <select
            value={profile.experience}
            onChange={(event: { target: { value: string } }) => setProfile({ ...profile, experience: event.target.value as Profile['experience'] })}
          >
            <option value="none">Hic yapmadim</option>
            <option value="some">Biraz yaptim</option>
            <option value="scratch">Scratch / Kodris / mBlock kullandim</option>
            <option value="python">Python veya baska dil kullandim</option>
          </select>
        </label>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Olusturuluyor...' : 'Profil Olustur'}
        </button>
      </form>
    </main>
  );
}
