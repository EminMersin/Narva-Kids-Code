interface FeedbackPopupProps {
  message: string;
  onClose: () => void;
}

export default function FeedbackPopup({ message, onClose }: FeedbackPopupProps) {
  const isHint = message.toLocaleLowerCase('tr-TR').includes('ipucu');
  const title = isHint ? 'Kucuk Ipucu' : 'Birlikte Duzeltelim';

  return (
    <div className="feedback-popup" role="dialog" aria-modal="true" aria-labelledby="feedback-popup-title">
      <div className="feedback-popup-card">
        <button className="feedback-popup-close" type="button" onClick={onClose} aria-label="Uyariyi kapat">
          ×
        </button>
        <div className="feedback-popup-icon" aria-hidden="true">
          {isHint ? '?' : '!'}
        </div>
        <div className="feedback-popup-copy">
          <span>{isHint ? 'Ipucu' : 'Uyari'}</span>
          <h2 id="feedback-popup-title">{title}</h2>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
}
