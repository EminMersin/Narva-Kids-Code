import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Layout } from '@/components/Layout';

export const metadata: Metadata = {
  metadataBase: new URL('https://kids.narvaai.com'),
  title: 'Narva Kids Code',
  description: 'Algoritma öğrenme platformu',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#4a90e2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head />
      <body><Layout>{children}</Layout></body>
    </html>
  );
}
