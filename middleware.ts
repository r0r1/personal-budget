import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  defaultLocale,
  locales,
  localePrefix: 'never'
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
