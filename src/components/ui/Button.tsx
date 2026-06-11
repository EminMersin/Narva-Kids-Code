import React from 'react';
import './Button.css';

type ButtonProps = {
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
};

/**
 * Basit, stilize edilmiş buton bileşeni.
 * Kullanım: <Button onClick={handle}>Gönder</Button>
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
}) => {
  return (
    <button
      className={`app-button ${className}`.trim()}
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
