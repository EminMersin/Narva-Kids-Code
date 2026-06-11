// src/modules/pwa/service-worker.ts
export class ServiceWorker {
  /**
   * Register the service worker
   */
  register(): void {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.info('[ServiceWorker] Registered:', registration.scope);
          })
          .catch((error) => {
            console.error('[ServiceWorker] Registration failed:', error);
          });
      });
    }
  }

  /**
   * Unregister all service workers
   */
  unregister(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
    }
  }
}