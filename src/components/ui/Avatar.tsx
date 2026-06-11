import React from 'react';

type AvatarProps = {
  src: string;
  size?: number;
};

const avatarConfig: Record<string, { bg: string; accent: string; label: string }> = {
  robot: { bg: '#dff7ff', accent: '#4b6bff', label: 'Robot' },
  explorer: { bg: '#fff1a8', accent: '#ff9f1c', label: 'Kasif' },
  astronaut: { bg: '#efe6ff', accent: '#7d5cff', label: 'Astronot' },
  narva: { bg: '#d8fff0', accent: '#20c997', label: 'Narva Bot' },
};

function AvatarSvg({ type }: { type: string }) {
  const config = avatarConfig[type] || avatarConfig.robot;

  if (type === 'explorer') {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r="44" fill={config.bg} />
        <path d="M24 40h48l-8-16H32l-8 16Z" fill={config.accent} />
        <path d="M30 40h36v10H30z" fill="#553b00" />
        <circle cx="48" cy="56" r="22" fill="#ffd7a8" />
        <circle cx="40" cy="55" r="3" fill="#18243a" />
        <circle cx="56" cy="55" r="3" fill="#18243a" />
        <path d="M39 66c6 5 12 5 18 0" fill="none" stroke="#18243a" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === 'astronaut') {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r="44" fill={config.bg} />
        <circle cx="48" cy="48" r="31" fill="#ffffff" stroke={config.accent} strokeWidth="6" />
        <rect x="27" y="38" width="42" height="25" rx="12" fill="#18243a" />
        <circle cx="40" cy="50" r="3" fill="#8ef5ff" />
        <circle cx="56" cy="50" r="3" fill="#8ef5ff" />
        <path d="M38 63h20" stroke="#8ef5ff" strokeWidth="4" strokeLinecap="round" />
        <circle cx="71" cy="29" r="5" fill="#ffcf5a" />
      </svg>
    );
  }

  if (type === 'narva') {
    return (
      <svg viewBox="0 0 96 96" aria-hidden="true">
        <circle cx="48" cy="48" r="44" fill={config.bg} />
        <path d="M25 58c0-17 10-30 23-30s23 13 23 30v10H25V58Z" fill={config.accent} />
        <path d="M35 28 28 17M61 28l7-11" stroke="#18243a" strokeWidth="5" strokeLinecap="round" />
        <circle cx="39" cy="51" r="4" fill="#18243a" />
        <circle cx="57" cy="51" r="4" fill="#18243a" />
        <path d="M39 62h18" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
        <rect x="32" y="69" width="32" height="8" rx="4" fill="#18243a" opacity="0.25" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 96 96" aria-hidden="true">
      <circle cx="48" cy="48" r="44" fill={config.bg} />
      <rect x="24" y="32" width="48" height="38" rx="14" fill={config.accent} />
      <rect x="35" y="22" width="26" height="13" rx="7" fill="#18243a" />
      <circle cx="39" cy="51" r="4" fill="#ffffff" />
      <circle cx="57" cy="51" r="4" fill="#ffffff" />
      <path d="M38 62h20" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
      <circle cx="28" cy="44" r="5" fill="#8ef5ff" />
      <circle cx="68" cy="44" r="5" fill="#8ef5ff" />
    </svg>
  );
}

export const Avatar: React.FC<AvatarProps> = ({ src, size = 64 }) => {
  const config = avatarConfig[src] || avatarConfig.robot;

  return (
    <div
      aria-label={`Avatar ${config.label}`}
      role="img"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: config.bg,
        border: `3px solid ${config.accent}`,
        overflow: 'hidden',
        boxShadow: '0 8px 0 rgba(27, 42, 78, 0.1)',
      }}
    >
      <AvatarSvg type={src} />
    </div>
  );
};
