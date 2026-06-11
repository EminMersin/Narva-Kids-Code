/**
 * LevelLoading – JSON dosyalarını yükler ve içe aktarır
 * - Dosya okuma hatalarını yakalar.
 * - Dosya yapısını basit kontrol eder.
 */
export class LevelLoading {
  /**
   * Tüm seviyeleri bir objeye yükler.
   * @param path JSON dosyasının yolu.
   * @returns {LevelData[]} Seviyeler nesnesi.
   */
  load(path: string): Record<string, unknown> {
    try {
      const fs = require('fs');
      const raw = fs.readFileSync(path, 'utf8');
      const data = JSON.parse(raw);

      // Basit kontrol: en az bir seviye olmalı
      if (!data || !Object.keys(data).length) {
        throw new Error('Level file is empty or malformed');
      }

      return data;
    } catch (error) {
      console.error(`[Levels] Load failed for ${path}:`, error);
      throw error;
    }
  }
}
