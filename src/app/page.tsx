'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { t } from '@/modules/i18n';
import { levelRegistry, type LevelId, type TrackId } from '@/modules/levels/registry';
import { useProgress } from '@/store/progress';

const previewBlocks = ['Tekrarla', 'Eger', 'Sag'];
const steps = ['Bloklari diz', 'Robotu calistir', 'Yildizlari topla'];

function getTrackContinueLevelId(
  track: TrackId,
  completedLevels: ReturnType<typeof useProgress.getState>['completedLevels'],
  currentLevel: LevelId,
): LevelId {
  const trackLevels = levelRegistry.filter((entry) => entry.track === track);
  const currentEntry = trackLevels.find((entry) => entry.id === currentLevel);

  if (currentEntry && !completedLevels[currentEntry.id]?.completed) {
    return currentEntry.id;
  }

  const nextOpen = trackLevels.find((entry, index) => {
    const previous = trackLevels[index - 1];
    return !completedLevels[entry.id]?.completed && (!previous || completedLevels[previous.id]?.completed);
  });

  return nextOpen?.id || trackLevels.at(-1)?.id || currentLevel;
}

export default function HomePage() {
  const hydrate = useProgress((state) => state.hydrate);
  const completedLevels = useProgress((state) => state.completedLevels);
  const currentLevel = useProgress((state) => state.currentLevel);
  const setCurrentLevel = useProgress((state) => state.setCurrentLevel);
  const pythonLevelId = getTrackContinueLevelId('python', completedLevels, currentLevel);
  const webLevelId = getTrackContinueLevelId('web', completedLevels, currentLevel);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-copy">
          <span className="home-kicker">Cocuk dostu kodlama oyunu</span>
          <h1>{t('appTitle')}</h1>
          <p>
            Robotu hedefe gotur, bloklari sirala ve Python benzeri komutlarin nasil
            olustugunu oyun oynarken kesfet.
          </p>
          <div className="home-actions">
            <Link className="home-primary" href="/onboarding">Hemen Basla</Link>
            <Link
              className="home-secondary home-python-action"
              href={`/level/${pythonLevelId}`}
              onClick={() => setCurrentLevel(pythonLevelId)}
            >
              Python'a Devam
            </Link>
            <Link
              className="home-secondary home-web-action"
              href={`/level/${webLevelId}`}
              onClick={() => setCurrentLevel(webLevelId)}
            >
              WEB'e Devam
            </Link>
            <Link className="home-map-action" href="/world-map">Dunya Haritasi</Link>
          </div>
        </div>

        <div className="home-preview" aria-label="Oyun onizlemesi">
          <div className="preview-board">
            {Array.from({ length: 25 }).map((_, index) => (
              <span key={index} className="preview-tile">
                {index === 11 && <span className="preview-robot">=</span>}
                {index === 13 && <span className="preview-goal">*</span>}
                {index === 7 && <span className="preview-wall">!</span>}
              </span>
            ))}
          </div>
          <div className="preview-editor">
            <strong>Blok Editoru</strong>
            <div>
              {previewBlocks.map((block) => (
                <span key={block}>{block}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="home-feature-grid" aria-label="Oyun ozellikleri">
        {steps.map((step, index) => (
          <article key={step} className="home-feature">
            <span>{index + 1}</span>
            <h2>{step}</h2>
            <p>
              {index === 0 && 'Yon bloklarini calisma alanina yerlestir.'}
              {index === 1 && 'Run veya Step ile robotun adimlarini izle.'}
              {index === 2 && 'Daha kisa cozumlerle daha cok yildiz kazan.'}
            </p>
          </article>
        ))}
      </section>

      <section className="home-level-strip" aria-label="Seviye akisi">
        <div>
          <span className="home-kicker">4 Dunya</span>
          <h2>80 seviyelik Faz 2 akisi</h2>
          <p>Hareketten siralamaya, dongulerden kosullara kadar kademeli ilerle.</p>
        </div>
        <div className="home-levels">
          {['H', 'S', 'D', 'K'].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </section>
    </main>
  );
}
