// src/modules/i18n/index.ts
import { tr } from './tr';
import { en } from './en';

export interface Locale {
  [key: string]: string;
}

export const locales = { tr, en };

export const defaultLocale = 'tr';

/**
 * Get translation for a specific key.
 * @param key - Translation key (supports nested keys like 'profile.nickname')
 * @param locale - Language code ('tr' or 'en')
 * @returns Translated string or the key itself if not found
 */
export function t(key: string, locale: string = defaultLocale): string {
  const lang = locales[locale as keyof typeof locales] || locales[defaultLocale];
  const keys = key.split('.');
  let result: any = lang;

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      return key; // Return key if translation not found
    }
  }

  return result as string;
}

/**
 * Get current language from localStorage or default
 */
export function getCurrentLocale(): string {
  try {
    return localStorage.getItem('narva_locale') || defaultLocale;
  } catch {
    return defaultLocale;
  }
}

/**
 * Set current language to localStorage
 */
export function setCurrentLocale(locale: string): void {
  try {
    localStorage.setItem('narva_locale', locale);
  } catch {
    // Silently fail if localStorage unavailable
  }
}
