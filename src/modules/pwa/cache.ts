// src/modules/pwa/cache.ts
export class Cache {
  private cacheName = 'narva-kids-code-v1';

  /**
   * Initialise the cache
   */
  async setup(): Promise<void> {
    if (typeof caches === 'undefined') return;
    try {
      await caches.open(this.cacheName);
      console.info('[PWA Cache] Cache initialized');
    } catch (err) {
      console.error('[PWA Cache] Setup failed:', err);
    }
  }

  /**
   * Store a request-response pair in cache
   */
  async set(request: Request, response: Response): Promise<void> {
    if (typeof caches === 'undefined') return;
    try {
      const cache = await caches.open(this.cacheName);
      await cache.put(request, response);
    } catch (err) {
      console.error('[PWA Cache] Set failed:', err);
    }
  }

  /**
   * Retrieve a cached response
   */
  async get(request: Request): Promise<Response | undefined> {
    if (typeof caches === 'undefined') return;
    try {
      const cache = await caches.open(this.cacheName);
      return await cache.match(request);
    } catch {
      return;
    }
  }
}