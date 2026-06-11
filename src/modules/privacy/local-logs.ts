// src/modules/privacy/local-logs.ts
export class LocalLogs {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    const request = indexedDB.open('narva-logs', 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('logs')) {
        db.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
    };
    request.onerror = (event) => {
      console.error('[LocalLogs] Init failed:', (event.target as IDBOpenDBRequest).error);
    };
  }

  async log(message: string, level: 'info' | 'warn' | 'error' = 'info'): Promise<void> {
    if (!this.db) return;
    const transaction = this.db.transaction(['logs'], 'readwrite');
    const store = transaction.objectStore('logs');
    await new Promise((resolve, reject) => {
      const request = store.add({
        timestamp: new Date().toISOString(),
        level,
        message,
      });
      request.onsuccess = resolve;
      request.onerror = () => reject(new Error('Log save failed'));
    });
  }

  async getLogs(limit: number = 100): Promise<any[]> {
    if (!this.db) return [];
    const transaction = this.db.transaction(['logs'], 'readonly');
    const store = transaction.objectStore('logs');
    const request = store.openCursor();
    const logs: any[] = [];
    return new Promise((resolve) => {
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          logs.push(cursor.value);
          if (logs.length >= limit) {
            resolve(logs);
            return;
          }
          cursor.continue();
        } else {
          resolve(logs);
        }
      };
    });
  }
}
