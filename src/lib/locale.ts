/**
 * Locale utilities for date, time, number, and currency formatting
 */

import { type Locale, localeConfig } from '@/i18n';

/**
 * Format a date according to locale preferences
 */
export function formatDate(
  date: Date | string | number,
  locale: Locale = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}

/**
 * Format a date and time according to locale preferences
 */
export function formatDateTime(
  date: Date | string | number,
  locale: Locale = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const config = localeConfig[locale];

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: config.timeFormat === '12h',
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}

/**
 * Format time according to locale preferences
 */
export function formatTime(
  date: Date | string | number,
  locale: Locale = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const config = localeConfig[locale];

  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: config.timeFormat === '12h',
    ...options,
  };

  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj);
}

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: Locale = 'en'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return rtf.format(-diffInMinutes, 'minute');
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return rtf.format(-diffInHours, 'hour');
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return rtf.format(-diffInDays, 'day');
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return rtf.format(-diffInMonths, 'month');
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return rtf.format(-diffInYears, 'year');
}

/**
 * Format a number according to locale preferences
 */
export function formatNumber(
  value: number,
  locale: Locale = 'en',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format currency according to locale preferences
 */
export function formatCurrency(
  amount: number,
  locale: Locale = 'en',
  currency?: string,
  options?: Intl.NumberFormatOptions
): string {
  const config = localeConfig[locale];
  const currencyCode = currency || config.currency;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    ...options,
  }).format(amount);
}

/**
 * Format a percentage
 */
export function formatPercentage(
  value: number,
  locale: Locale = 'en',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value / 100);
}

/**
 * Format a file size in a human-readable format
 */
export function formatFileSize(
  bytes: number,
  locale: Locale = 'en',
  decimals: number = 2
): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format a duration in milliseconds to a human-readable format
 */
export function formatDuration(
  milliseconds: number,
  locale: Locale = 'en'
): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Parse a date string according to locale format
 */
export function parseDate(dateString: string, locale: Locale = 'en'): Date | null {
  try {
    const config = localeConfig[locale];

    // Handle different date formats based on locale
    if (config.dateFormat === 'MM/DD/YYYY') {
      const [month, day, year] = dateString.split('/').map(Number);
      return new Date(year, month - 1, day);
    } else if (config.dateFormat === 'DD/MM/YYYY') {
      const [day, month, year] = dateString.split('/').map(Number);
      return new Date(year, month - 1, day);
    }

    // Fallback to standard Date parsing
    return new Date(dateString);
  } catch {
    return null;
  }
}

/**
 * Get the locale-specific date format pattern
 */
export function getDateFormat(locale: Locale = 'en'): string {
  return localeConfig[locale].dateFormat;
}

/**
 * Get the locale-specific time format pattern
 */
export function getTimeFormat(locale: Locale = 'en'): string {
  const config = localeConfig[locale];
  return config.timeFormat === '12h' ? 'hh:mm A' : 'HH:mm';
}

/**
 * Check if a locale uses 12-hour format
 */
export function uses12HourFormat(locale: Locale = 'en'): boolean {
  return localeConfig[locale].timeFormat === '12h';
}

/**
 * Get the locale-specific currency code
 */
export function getCurrencyCode(locale: Locale = 'en'): string {
  return localeConfig[locale].currency;
}

/**
 * Format a list of items according to locale preferences
 */
export function formatList(
  items: string[],
  locale: Locale = 'en',
  type: 'conjunction' | 'disjunction' | 'unit' = 'conjunction'
): string {
  return new Intl.ListFormat(locale, { type }).format(items);
}

/**
 * Get locale-aware sorting comparator
 */
export function getLocaleComparator(locale: Locale = 'en'): (a: string, b: string) => number {
  const collator = new Intl.Collator(locale, { sensitivity: 'base' });
  return (a, b) => collator.compare(a, b);
}
