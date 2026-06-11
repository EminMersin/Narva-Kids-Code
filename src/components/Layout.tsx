import React, { ReactNode } from 'react';
import './Layout.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

/**
 * Genel uygulama layout'u. Header ve footer burada yer alabilir.
 * Şu an sadece basit bir container sağlıyor.
 */
export const Layout = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="app-layout">
      <Header />
        {children}
        <Footer />
    </div>
  );
};
