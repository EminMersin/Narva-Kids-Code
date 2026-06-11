import React, { ReactNode } from 'react';
import './Modal.css';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children?: ReactNode;
  className?: string;
};

/**
 * Basit modal bileşeni. `isOpen` true olduğunda gösterir.
 * Gerçek uygulamalarda portal kullanılabilir; burada basit bir overlay.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className = '',
}) => {
  if (!isOpen) return null;
  return (
    <div className={`app-modal-overlay ${className}`} onClick={onClose}>
      <div className="app-modal-content" onClick={(e: { stopPropagation: () => void }) => e.stopPropagation()}>
        {children}
        <button className="app-modal-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
};
