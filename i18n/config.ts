import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const locales = ['id', 'en'] as const;
export const defaultLocale = 'id';

export const { Link, redirect, usePathname, useRouter } = createSharedPathnamesNavigation({ locales });
