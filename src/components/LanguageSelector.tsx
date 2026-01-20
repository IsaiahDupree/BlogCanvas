'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, localeLabels, localeFlags, type Locale } from '@/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * Language selector component
 * Allows users to switch between available locales
 */
export function LanguageSelector() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('settings');

  const handleLocaleChange = (newLocale: string) => {
    // Store locale preference in cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;

    // Update URL with new locale
    const currentPath = pathname;
    let newPath = currentPath;

    // Remove current locale prefix if exists
    for (const loc of locales) {
      if (currentPath.startsWith(`/${loc}/`)) {
        newPath = currentPath.slice(loc.length + 1);
        break;
      }
      if (currentPath === `/${loc}`) {
        newPath = '/';
        break;
      }
    }

    // Add new locale prefix (unless it's the default locale)
    if (newLocale !== 'en') {
      newPath = `/${newLocale}${newPath}`;
    }

    // Navigate to new path
    router.push(newPath);
    router.refresh();
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="language-select" className="text-sm font-medium">
        {t('language')}:
      </label>
      <Select value={locale} onValueChange={handleLocaleChange}>
        <SelectTrigger id="language-select" className="w-[180px]">
          <SelectValue>
            <span className="flex items-center gap-2">
              <span>{localeFlags[locale]}</span>
              <span>{localeLabels[locale]}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {locales.map((loc) => (
            <SelectItem key={loc} value={loc}>
              <span className="flex items-center gap-2">
                <span>{localeFlags[loc]}</span>
                <span>{localeLabels[loc]}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Compact language selector for mobile/navbar
 */
export function CompactLanguageSelector() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: string) => {
    // Store locale preference in cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;

    // Update URL with new locale
    const currentPath = pathname;
    let newPath = currentPath;

    // Remove current locale prefix if exists
    for (const loc of locales) {
      if (currentPath.startsWith(`/${loc}/`)) {
        newPath = currentPath.slice(loc.length + 1);
        break;
      }
      if (currentPath === `/${loc}`) {
        newPath = '/';
        break;
      }
    }

    // Add new locale prefix (unless it's the default locale)
    if (newLocale !== 'en') {
      newPath = `/${newLocale}${newPath}`;
    }

    // Navigate to new path
    router.push(newPath);
    router.refresh();
  };

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-[100px] border-none shadow-none">
        <SelectValue>
          <span className="flex items-center gap-1">
            <span>{localeFlags[locale]}</span>
            <span className="text-xs">{locale.toUpperCase()}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            <span className="flex items-center gap-2">
              <span>{localeFlags[loc]}</span>
              <span>{localeLabels[loc]}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Language toggle button (for simple 2-language setups)
 */
export function LanguageToggle() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleToggle = () => {
    // Toggle between en and es
    const newLocale = locale === 'en' ? 'es' : 'en';

    // Store locale preference in cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;

    // Update URL with new locale
    const currentPath = pathname;
    let newPath = currentPath;

    // Remove current locale prefix if exists
    for (const loc of locales) {
      if (currentPath.startsWith(`/${loc}/`)) {
        newPath = currentPath.slice(loc.length + 1);
        break;
      }
      if (currentPath === `/${loc}`) {
        newPath = '/';
        break;
      }
    }

    // Add new locale prefix (unless it's the default locale)
    if (newLocale !== 'en') {
      newPath = `/${newLocale}${newPath}`;
    }

    // Navigate to new path
    router.push(newPath);
    router.refresh();
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
      aria-label={`Switch to ${locale === 'en' ? 'Spanish' : 'English'}`}
    >
      <span>{locale === 'en' ? localeFlags.es : localeFlags.en}</span>
      <span className="hidden sm:inline">{locale === 'en' ? 'Español' : 'English'}</span>
    </button>
  );
}
