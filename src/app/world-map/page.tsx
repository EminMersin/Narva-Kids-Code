'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapLevelCard } from '@/components/MapLevelCard';
import useWorldMap from '@/hooks/useWorldMap';
import { t } from '@/modules/i18n';
import { ProfileManager } from '@/modules/profiles/profileManager';
import { useProgress } from '@/store/progress';

export default function WorldMapPage() {
  const router = useRouter();
  const { worlds, completedCount, totalStars, nextOpenLevelId } = useWorldMap();
  const setCurrentLevel = useProgress((state) => state.setCurrentLevel);

  useEffect(() => {
    let active = true;

    async function ensureProfile() {
      const profileId = localStorage.getItem('narva_profile_id');
      if (profileId) return;

      const profiles = await new ProfileManager().list();
      const firstProfile = profiles[0];
      if (firstProfile?.id) {
        localStorage.setItem('narva_profile_id', firstProfile.id);
        return;
      }

      if (active) router.push('/onboarding');
    }

    void ensureProfile();
    return () => {
      active = false;
    };
  }, [router]);

  const openLevel = (id: string) => {
    setCurrentLevel(id as typeof nextOpenLevelId);
    router.push(`/level/${id}`);
  };

  const trackGroups = [
    {
      id: 'python',
      title: 'Python Dünya Haritası',
      description: 'Robot görevleriyle komut, değişken, koşul ve döngüleri öğren.',
      worlds: worlds.filter((world) => world.track === 'python'),
    },
    {
      id: 'web',
      title: 'WEB Dünyası',
      description: 'HTML ve CSS bloklarıyla gerçek web sayfaları kur.',
      worlds: worlds.filter((world) => world.track === 'web'),
    },
  ];

  return (
    <main className="world-map-container">
      <header className="world-map-header">
        <div>
          <span className="level-world">Narva Haritasi</span>
          <h1>{t('worldMap')}</h1>
          <p>Python ve WEB eğitim yollarından birini seç, seviyeleri sırayla tamamla.</p>
        </div>
        <div className="world-summary">
          <strong>{completedCount}/{worlds.reduce((sum, world) => sum + world.levels.length, 0)}</strong>
          <span>Seviye</span>
          <strong>{totalStars}</strong>
          <span>Yildiz</span>
        </div>
      </header>

      <section className="world-continue">
        <div>
          <h2>Devam Et</h2>
          <p>Siradaki acik seviyeden devam et.</p>
        </div>
        <button type="button" onClick={() => openLevel(nextOpenLevelId)}>
          Oyuna Don
        </button>
      </section>

      <div className="track-sections">
        {trackGroups.map((track) => (
          <section key={track.id} className={`track-section track-${track.id}`}>
            <header className="track-section-header">
              <div>
                <span className="level-world">{track.id === 'python' ? 'PY' : 'WEB'}</span>
                <h2>{track.title}</h2>
                <p>{track.description}</p>
              </div>
              <strong>{track.worlds.reduce((sum, world) => sum + world.completedCount, 0)}/{track.worlds.reduce((sum, world) => sum + world.levels.length, 0)}</strong>
            </header>

            <div className="world-sections">
              {track.worlds.map((world) => (
                <section key={world.id} className={`world-section ${world.state}`} aria-label={`${world.title} seviyeleri`}>
                  <header className="world-section-header">
                    <div>
                      <span className="map-level-badge">{world.state === 'locked' ? 'Kilitli' : world.state === 'completed' ? 'Tamamlandi' : 'Acik'}</span>
                      <h2>{world.title}</h2>
                      <p>{world.description}</p>
                    </div>
                    <strong>{world.completedCount}/{world.levels.length}</strong>
                  </header>
                  <section className="map-level-grid">
                    {world.levels.map((level) => (
                      <MapLevelCard
                        key={level.id}
                        id={level.id}
                        order={level.order}
                        title={`${level.title} (${level.mode})`}
                        state={level.state}
                        stars={level.stars}
                        onOpen={openLevel}
                      />
                    ))}
                  </section>
                </section>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
