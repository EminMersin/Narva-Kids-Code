import { Cache } from './cache';
import { ServiceWorker } from './service-worker';
import { defaultManifest, type PwaManifest } from './manifest';

export class PwaModule {
  private cache = new Cache();
  private sw = new ServiceWorker();
  private manifest = defaultManifest;

  init(): void {
    this.cache.setup();
    this.sw.register();
  }

  getCache(): Cache {
    return this.cache;
  }

  getServiceWorker(): ServiceWorker {
    return this.sw;
  }

  getManifest(): PwaManifest {
    return this.manifest;
  }
}
