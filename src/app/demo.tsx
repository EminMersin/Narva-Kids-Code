'use client';

import { useState } from 'react';
import { t, getCurrentLocale, setCurrentLocale } from '@/modules/i18n';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

export default function DemoPage() {
  const [showModal, setShowModal] = useState(false);
  const [locale, setLocale] = useState(getCurrentLocale());
  const [code, setCode] = useState('move_forward()');

  const toggleLocale = () => {
    const nextLocale = locale === 'tr' ? 'en' : 'tr';
    setCurrentLocale(nextLocale);
    setLocale(nextLocale);
  };

  return (
    <div className="demo-page">
      <h1>{t('welcome', locale)}</h1>
      <Button onClick={() => setShowModal(true)}>Code Example</Button>
      <Button onClick={toggleLocale}>{locale === 'tr' ? 'English' : 'Turkce'}</Button>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <h2>Sample Code</h2>
        <Card>
          <Input
            placeholder="Enter code here..."
            value={code}
            onChange={(event: { target: { value: string } }) => setCode(event.target.value)}
          />
        </Card>
        <Button onClick={() => setShowModal(false)}>Close</Button>
      </Modal>
    </div>
  );
}
