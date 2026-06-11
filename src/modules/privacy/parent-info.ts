// src/modules/privacy/parent-info.ts
export class ParentInfo {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    const request = indexedDB.open('narva-parent-info', 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('info')) {
        db.createObjectStore('info', { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => {
      this.db = (event.target as IDBOpenDBRequest).result;
    };
  }

  async saveInfo(data: Record<string, any>): Promise<void> {
    if (!this.db) return;
    const transaction = this.db.transaction(['info'], 'readwrite');
    const store = transaction.objectStore('info');
    await new Promise((resolve, reject) => {
      const request = store.put({ id: 'default', ...data });
      request.onsuccess = resolve;
      request.onerror = () => reject(new Error('Save failed'));
    });
  }

  async getInfo(): Promise<Record<string, any> | null> {
    if (!this.db) return null;
    const transaction = this.db.transaction(['info'], 'readonly');
    const store = transaction.objectStore('info');
    return new Promise((resolve) => {
      const request = store.get('default');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }
}