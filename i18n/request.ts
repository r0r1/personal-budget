import { getRequestConfig } from 'next-intl/server';
import { locales } from './config';

export default getRequestConfig(async ({ locale }) => {
  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    locale: locale as typeof locales[number],
    timeZone: 'Asia/Jakarta'
  };
});
