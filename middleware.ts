/**
 * Capture ?lang=… from the WebApp URL and persist it as a cookie so future
 * navigations keep the same locale without needing the query parameter.
 *
 * We do NOT use next-intl's locale-prefix routing — URLs stay clean
 * (e.g. /create/presentation, not /uz/create/presentation) which is important
 * because the bot generates dozens of deep-links.
 */
import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED = new Set(['uz', 'ru', 'en']);

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const langParam = url.searchParams.get('lang');
  const response = NextResponse.next();

  if (langParam && SUPPORTED.has(langParam)) {
    const existing = req.cookies.get('NEXT_LOCALE')?.value;
    if (existing !== langParam) {
      response.cookies.set('NEXT_LOCALE', langParam, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax',
      });
    }
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};
