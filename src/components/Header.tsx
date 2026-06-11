'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import './Header.css';
import { getLevelById, WORLD_META, type WorldId } from '@/modules/levels/registry';
import { useProgress } from '@/store/progress';

export const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const levelId = pathname?.match(/^\/level\/([^/]+)/)?.[1];
  const level = levelId ? getLevelById(decodeURIComponent(levelId)) : null;
  const stars = useProgress((state) => level ? state.getStars(level.id) : 0);
  const world = level ? WORLD_META[level.world as WorldId] : null;

  return (
    <header className="app-header">
      <Link className="logo-title" href="/" aria-label="Narva Kids Code ana sayfa">
        <span aria-hidden="true">NK</span>
        <strong>Narva Kids Code</strong>
      </Link>

      <div className="header-context" aria-live="polite">
        {level ? (
          <>
            <span>{world?.title || 'Kod Dunyasi'}</span>
            <h1>{level.title}</h1>
          </>
        ) : (
          <>
            <span>Bloklardan Python'a</span>
            <h1>Cocuk dostu kodlama oyunu</h1>
          </>
        )}
      </div>

      <nav className="header-actions" aria-label="Ust menu">
        {level ? (
          <>
            <div className="header-stars" aria-label={`${stars} yildiz`}>
              {Array.from({ length: 3 }).map((_, index) => (
                <span key={index} className={index < stars ? 'earned' : ''}>*</span>
              ))}
            </div>
            <Link href="/world-map">Harita</Link>
            <button type="button" onClick={() => router.refresh()}>Yenile</button>
          </>
        ) : (
          <>
            <Link href="/onboarding">Basla</Link>
            <Link href="/world-map">Harita</Link>
          </>
        )}
      </nav>
    </header>
  );
};
