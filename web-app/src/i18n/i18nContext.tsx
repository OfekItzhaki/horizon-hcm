import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useAppStore } from '../store';
import enMessages from './messages/en.json';
import heMessages from './messages/he.json';

type Messages = typeof enMessages;
type MessageKey = string;

interface I18nContextValue {
  locale: 'en' | 'he';
  messages: Messages;
  t: (key: MessageKey, params?: Record<string, string>) => string;
  setLocale: (locale: 'en' | 'he') => void;
  dir: 'ltr' | 'rtl';
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const messagesMap = {
  en: enMessages,
  he: heMessages,
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const { language, setLanguage } = useAppStore();
  const locale = language as 'en' | 'he';

  const value = useMemo<I18nContextValue>(() => {
    const messages = messagesMap[locale];
    const dir = locale === 'he' ? 'rtl' : 'ltr';

    const t = (key: MessageKey, params?: Record<string, string>): string => {
      const keys = key.split('.');
      let value: any = messages;

      for (const k of keys) {
        value = value?.[k];
        if (value === undefined) {
          console.warn(`Translation key not found: ${key}`);
          return key;
        }
      }

      if (typeof value !== 'string') {
        console.warn(`Translation value is not a string: ${key}`);
        return key;
      }

      // Replace parameters
      if (params) {
        return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
          return params[paramKey] ?? match;
        });
      }

      return value;
    };

    return {
      locale,
      messages,
      t,
      setLocale: setLanguage,
      dir,
    };
  }, [locale, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}
