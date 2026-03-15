import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { en } from './translations/en';
import { he } from './translations/he';

const i18n = new I18n({ en, he });

// Default to device locale, fallback to 'en'
const deviceLocale = getLocales()[0]?.languageCode ?? 'en';
i18n.locale = ['en', 'he'].includes(deviceLocale) ? deviceLocale : 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export { i18n };

/** Set the active locale (call this when user changes language) */
export function setLocale(locale: 'en' | 'he') {
  i18n.locale = locale;
}

/** Translate a key, e.g. t('common.save') */
export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}
