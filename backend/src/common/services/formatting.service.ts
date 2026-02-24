import { Injectable } from '@nestjs/common';

/**
 * Service for formatting numbers, dates, and currencies with locale support.
 * 
 * Provides internationalization (i18n) formatting utilities using the Intl API.
 * Supports multiple locales and timezones, with defaults for Israeli locale (he-IL).
 * 
 * @example
 * ```typescript
 * // Format currency
 * const price = formattingService.formatCurrency(1500, 'ILS', 'he-IL'); // "₪1,500.00"
 * 
 * // Format relative time
 * const time = formattingService.formatRelativeTime(new Date(Date.now() - 3600000)); // "1 hour ago"
 * ```
 */
@Injectable()
export class FormattingService {
  /**
   * Format currency with locale support
   */
  formatCurrency(
    amount: number,
    currency: string = 'ILS',
    locale: string = 'he-IL',
  ): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  }

  /**
   * Format date with locale support
   */
  formatDate(date: Date, locale: string = 'he-IL'): string {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  /**
   * Format date and time with locale support
   */
  formatDateTime(date: Date, locale: string = 'he-IL'): string {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  /**
   * Format time with locale support
   */
  formatTime(date: Date, locale: string = 'he-IL'): string {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  }

  /**
   * Convert date to specific timezone
   */
  convertTimezone(date: Date, timezone: string = 'Asia/Jerusalem'): Date {
    const dateString = date.toLocaleString('en-US', { timeZone: timezone });
    return new Date(dateString);
  }

  /**
   * Format date in specific timezone
   */
  formatDateInTimezone(
    date: Date,
    timezone: string = 'Asia/Jerusalem',
    locale: string = 'he-IL',
  ): string {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezone,
      timeZoneName: 'short',
    }).format(date);
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(date: Date, locale: string = 'he-IL'): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (diffDay > 0) {
      return rtf.format(-diffDay, 'day');
    } else if (diffHour > 0) {
      return rtf.format(-diffHour, 'hour');
    } else if (diffMin > 0) {
      return rtf.format(-diffMin, 'minute');
    } else {
      return rtf.format(-diffSec, 'second');
    }
  }

  /**
   * Format number with locale support
   */
  formatNumber(
    value: number,
    locale: string = 'he-IL',
    options?: Intl.NumberFormatOptions,
  ): string {
    return new Intl.NumberFormat(locale, options).format(value);
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number, locale: string = 'he-IL'): string {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value / 100);
  }
}
