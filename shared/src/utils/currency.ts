/**
 * Format number as currency
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'ILS')
 * @param locale - Locale code (default: 'he-IL')
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'ILS',
  locale: string = 'he-IL'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format number with thousands separator
 */
export const formatNumber = (value: number, locale: string = 'he-IL'): string => {
  return new Intl.NumberFormat(locale).format(value);
};

/**
 * Parse currency string to number
 */
export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
};
