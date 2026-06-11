interface ResultPanelProps {
  stars: number;
  commandCount: number;
  bestCommandCount: number;
  feedback: string;
  onRetry: () => void;
  onNext: () => void;
}

export default function ResultPanel({
  stars,
  commandCount,
  bestCommandCount,
  feedback,
  onRetry,
  onNext,
}: ResultPanelProps) {
  return (
    <div className="result-panel" role="dialog" aria-modal="true" aria-label="Seviye sonucu">
      <div className="result-panel-card">
        <span className="result-kicker">Gorev Tamamlandi</span>
        <h2>Basardin!</h2>
        <div className="result-stars" aria-label={`${stars} yildiz`}>
          {Array.from({ length: 3 }).map((_, index) => (
            <span key={index} className={index < stars ? 'earned' : ''}>*</span>
          ))}
        </div>
        <div className="result-feedback" aria-label="Ogrenme geri bildirimi">
          <div>
            <span>Kullandigin blok</span>
            <strong>{commandCount}</strong>
          </div>
          <div>
            <span>3 yildiz hedefi</span>
            <strong>{bestCommandCount}</strong>
          </div>
        </div>
        <p className="result-tip">{feedback}</p>
        <div className="result-actions">
          <button type="button" onClick={onRetry}>Tekrar Dene</button>
          <button type="button" onClick={onNext}>Sonraki Seviye</button>
        </div>
      </div>
    </div>
  );
}
