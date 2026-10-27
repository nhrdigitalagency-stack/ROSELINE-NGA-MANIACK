import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import fr from './fr.json';
import en from './en.json';
import { Locale } from '../types';

const translations: Record<Locale, typeof fr> = { fr, en };

interface I18nContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  toggleLocale: () => void;
  t: typeof fr;
  formatDate: (dateStr: string | null) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = 'rnm_soutenance_locale';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'fr' || saved === 'en') return saved;
    } catch {
      // ignore storage errors
    }
    return 'fr';
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = translations[locale].meta.siteTitle;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore storage errors
    }
  }, [locale]);

  const setLocale = useCallback((loc: Locale) => {
    setLocaleState(loc);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => (prev === 'fr' ? 'en' : 'fr'));
  }, []);

  const formatDate = useCallback(
    (dateStr: string | null) => {
      if (!dateStr) {
        return translations[locale].hero.dateToConfirm;
      }
      try {
        const [year, month, day] = dateStr.split('-').map(Number);
        if (!year || !month || !day) return dateStr;
        const dateObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(dateObj);
      } catch {
        return dateStr;
      }
    },
    [locale]
  );

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        toggleLocale,
        t: translations[locale],
        formatDate,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
