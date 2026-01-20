import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Define supported locales
export const locales = ['en', 'es'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'en';

// Locale labels for UI
export const localeLabels: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};

// Locale flags/icons for UI
export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
};

// Locale configurations
export const localeConfig: Record<Locale, {
  currency: string;
  dateFormat: string;
  timeFormat: string;
}> = {
  en: {
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
  },
  es: {
    currency: 'EUR',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
  },
};

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
