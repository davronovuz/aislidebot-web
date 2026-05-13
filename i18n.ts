/**
 * next-intl request config — locale resolved from a cookie set on first WebApp load.
 *
 * The bot passes ?lang=uz|ru|en in the WebApp URL; middleware.ts captures it
 * and stores in a cookie so subsequent navigations and refreshes keep the choice.
 */
import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';

export const SUPPORTED_LOCALES = ['uz', 'ru', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'uz';

export function normalizeLocale(value: string | undefined | null): Locale {
  if (!value) return DEFAULT_LOCALE;
  const v = value.toLowerCase().trim();
  if ((SUPPORTED_LOCALES as readonly string[]).includes(v)) return v as Locale;
  if (v.startsWith('uz')) return 'uz';
  if (v.startsWith('ru')) return 'ru';
  if (v.startsWith('en')) return 'en';
  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  // Cookie wins (set by middleware on first ?lang=… visit). Fall back to Accept-Language.
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get('NEXT_LOCALE')?.value;
  let locale = normalizeLocale(fromCookie);

  if (!fromCookie) {
    const hdrs = await headers();
    const accept = hdrs.get('accept-language') || '';
    locale = normalizeLocale(accept.split(',')[0]);
  }

  const messages = (await import(`./messages/${locale}.json`)).default;
  return { locale, messages };
});
