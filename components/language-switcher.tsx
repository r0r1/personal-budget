'use client';

import { usePathname, useParams } from 'next/navigation';
import { useRouter } from '@/i18n/config';
import { Button } from '@/components/ui/button';

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const currentLocale = params.locale as string;

  const switchLanguage = (locale: string) => {
    // Remove the current locale from pathname
    const pathWithoutLocale = pathname.replace(/^\/[^/]+/, '');
    router.push(pathWithoutLocale || '/', { locale });
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant={currentLocale === 'id' ? 'default' : 'outline'} 
        size="sm"
        onClick={() => switchLanguage('id')}
        className="w-12"
        title="Bahasa Indonesia"
      >
        ID
      </Button>
      <Button 
        variant={currentLocale === 'en' ? 'default' : 'outline'} 
        size="sm"
        onClick={() => switchLanguage('en')}
        className="w-12"
        title="English"
      >
        EN
      </Button>
    </div>
  );
}
