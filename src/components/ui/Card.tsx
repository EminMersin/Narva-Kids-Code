import React from 'react';
import './Card.css';

type CardProps = {
  children?: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
};

/**
 * Basit kart bileşeni. İçeriği çevreleyen bir kutu.
 */
export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => (
  <div className={`app-card ${className}`.trim()} onClick={onClick}>{children}</div>
);
