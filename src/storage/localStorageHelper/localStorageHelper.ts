/**
 * LocalStorageHelper — Narva Kids Code
 *
 * localStorage üzerinden güvenli JSON serileştirme/okuma katmanı.
 * Tüm değerler JSON.stringify/JSON.parse ile işlenir.
 */

export class LocalStorageHelper {
  /**
   * Veriyi localStorage'a kaydeder.
   */
  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`[LocalStorageHelper] set hatası (${key}):`, e);
    }
  }

  /**
   * Veriyi localStorage'dan okur. Bulamazsa null döner.
   */
  static get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (e) {
      console.error(`[LocalStorageHelper] get hatası (${key}):`, e);
      return null;
    }
  }

  /**
   * Belirtilen anahtarı localStorage'dan siler.
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`[LocalStorageHelper] remove hatası (${key}):`, e);
    }
  }

  /**
   * Tüm localStorage verilerini temizler.
   */
  static clear(): void {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('[LocalStorageHelper] clear hatası:', e);
    }
  }
}
