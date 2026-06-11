/**
 * IndexedDBHelper – IndexDB wrapper katmanı
 *
 * Kullanıcı profilleri, ilerleme verileri ve daha büyük yapılandırılmış verileri
 * IndexedDB üzerinden saklamak için kullanılır.
 */

export interface StoredData {
  key: string;
  value: any;
  timestamp: string;
}

export class IndexedDBHelper {
  private dbName = 'narva-kids-code';
  private dbVersion = 1;
  private storeName = 'profiles';

  /**
   * IndexedDB'yi açar veya oluşturur.
   */
  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        reject(new Error(`IndexedDB açılamadı: ${(event.target as IDBOpenDBRequest).error?.message}`));
      };
    });
  }

  /**
   * Veri kaydeder.
   */
  async set(key: string, value: any): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.put({
        key,
        value,
        timestamp: new Date().toISOString(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Kayıt hatası: ${request.error?.message}`));
    });
  }

  /**
   * Veri okur.
   */
  async get(key: string): Promise<any | null> {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };
      request.onerror = () => reject(new Error(`Okuma hatası: ${request.error?.message}`));
    });
  }

  /**
   * Belirtilen anahtarı siler.
   */
  async remove(key: string): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Silme hatası: ${request.error?.message}`));
    });
  }

  /**
   * Tüm verileri temizler.
   */
  async clear(): Promise<void> {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Temizleme hatası: ${request.error?.message}`));
    });
  }

  /**
   * Tüm anahtarları listeler.
   */
  async getAllKeys(): Promise<string[]> {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result.map(String));
      request.onerror = () => reject(new Error(`Listeleme hatası: ${request.error?.message}`));
    });
  }

  /**
   * Tüm verileri döner.
   */
  async getAll(): Promise<StoredData[]> {
    const db = await this.getDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error(`Veri okuma hatası: ${request.error?.message}`));
    });
  }
}

export default IndexedDBHelper;
