import type { LevelState } from '@/hooks/useWorldMap';

interface MapLevelCardProps {
  id: string;
  order: number;
  title: string;
  state: LevelState;
  stars: number;
  onOpen: (id: string) => void;
}

export function MapLevelCard({ id, order, title, state, stars, onOpen }: MapLevelCardProps) {
  const isLocked = state === 'locked';
  const isCompleted = state === 'completed';

  return (
    <article className={`map-level-card ${state}`}>
      <div className="map-level-badge">{isLocked ? 'Kilitli' : `Seviye ${order}`}</div>
      <div className="map-level-orb" aria-hidden="true">
        {isLocked ? 'K' : isCompleted ? 'OK' : order}
      </div>
      <h3>{title}</h3>
      <div className="map-level-stars" aria-label={`${stars} yildiz`}>
        {Array.from({ length: 3 }).map((_, index) => (
          <span key={index} className={index < stars ? 'earned' : ''}>*</span>
        ))}
      </div>
      <button type="button" disabled={isLocked} onClick={() => onOpen(id)}>
        {isCompleted ? 'Tekrar Oyna' : isLocked ? 'Yakinda' : 'Basla'}
      </button>
    </article>
  );
}
