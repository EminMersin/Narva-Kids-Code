import React from 'react';
import './globals.css';
import { Layout } from '@/components/Layout';

export const metadata = {
  title: 'Narva Kids Code',
  description: 'Algoritma öğrenme platformu',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head />
      <body><Layout>{children}</Layout></body>
    </html>
  );
}
