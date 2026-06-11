import { useState } from 'react';
import Link from 'next/link';
import { t, setCurrentLocale } from '@/modules/i18n';
import { Button } from '@/components/ui/Button';

export default function SettingsPage() {
  const [language, setLanguage] = useState('tr');

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLanguage = event.target.value;
    setLanguage(nextLanguage);
    setCurrentLocale(nextLanguage);
  };

  return (
    <div className="settings-page">
      <h1>{t('welcome', language)}</h1>
      <label>
        {t('language', language)}
        <select value={language} onChange={handleLanguageChange}>
          <option value="tr">{t('turkish', language)}</option>
          <option value="en">{t('english', language)}</option>
        </select>
      </label>
      <Link href="/">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
