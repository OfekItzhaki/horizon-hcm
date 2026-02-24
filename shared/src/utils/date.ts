import {
  format,
  formatDistance,
  formatRelative,
  parseISO,
  isValid,
  isFuture,
  isPast,
} from 'date-fns';
import { enUS, he } from 'date-fns/locale';

const locales = { en: enUS, he };

export const dateUtils = {
  /**
   * Format date to a specific pattern
   * @param date - Date string or Date object
   * @param pattern - Format pattern (default: 'PP')
   * @param locale - Locale code (default: 'en')
   */
  format: (date: string | Date, pattern: string = 'PP', locale: string = 'en'): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    return format(dateObj, pattern, { locale: locales[locale as keyof typeof locales] || enUS });
  },

  /**
   * Format date to relative time (e.g., "2 hours ago")
   */
  formatRelative: (
    date: string | Date,
    baseDate: Date = new Date(),
    locale: string = 'en'
  ): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    return formatRelative(dateObj, baseDate, {
      locale: locales[locale as keyof typeof locales] || enUS,
    });
  },

  /**
   * Format date to distance (e.g., "in 2 hours")
   */
  formatDistance: (
    date: string | Date,
    baseDate: Date = new Date(),
    locale: string = 'en'
  ): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return '';
    return formatDistance(dateObj, baseDate, {
      addSuffix: true,
      locale: locales[locale as keyof typeof locales] || enUS,
    });
  },

  /**
   * Check if date is in the future
   */
  isFuture: (date: string | Date): boolean => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) && isFuture(dateObj);
  },

  /**
   * Check if date is in the past
   */
  isPast: (date: string | Date): boolean => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj) && isPast(dateObj);
  },

  /**
   * Check if date is valid
   */
  isValid: (date: string | Date): boolean => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isValid(dateObj);
  },

  /**
   * Parse ISO date string
   */
  parseISO: (dateString: string): Date => parseISO(dateString),
};
