// src/modules/pwa/manifest.ts
export interface PwaManifest {
  name: string;
  short_name: string;
  start_url: string;
  display: 'standalone' | 'fullscreen' | 'minimal' | 'browser';
  background_color: string;
  theme_color: string;
  icons?: Array<{
    src: string;
    sizes: string;
    type: string;
  }>;
}

export const defaultManifest: PwaManifest = {
  name: 'Narva Kids Code',
  short_name: 'NarvaKids',
  start_url: '/',
  display: 'standalone',
  background_color: '#f8f9fa',
  theme_color: '#4a90e2',
  icons: [
    {
      src: '/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: '/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
    },
  ],
};