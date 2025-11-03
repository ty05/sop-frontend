'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const changeLanguage = (newLocale: string) => {
    // Save to localStorage
    localStorage.setItem('NEXT_LOCALE', newLocale);

    // Update URL - remove current locale and add new one
    const segments = pathname.split('/');
    segments[1] = newLocale; // Replace the locale segment
    const newPathname = segments.join('/');

    router.push(newPathname);
    router.refresh();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 text-sm"
      >
        <span>{locale === 'ja' ? '🇯🇵' : '🇬🇧'}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-50 border">
          <button
            onClick={() => changeLanguage('en')}
            className={`block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm ${
              locale === 'en' ? 'bg-blue-50 text-blue-600 font-medium' : ''
            }`}
          >
            🇬🇧 English
          </button>
          <button
            onClick={() => changeLanguage('ja')}
            className={`block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm ${
              locale === 'ja' ? 'bg-blue-50 text-blue-600 font-medium' : ''
            }`}
          >
            🇯🇵 日本語
          </button>
        </div>
      )}
    </div>
  );
}
