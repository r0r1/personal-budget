"use client"

import { useSession, signIn, signOut } from "next-auth/react";
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/config";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";

export function Navigation() {
  const { data: session } = useSession();
  const t = useTranslations();

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold">
            {t('common.appName')}
          </Link>
          {session && (
            <>
              <Link href="/" className="text-sm hover:text-primary">
                {t('navigation.home')}
              </Link>
              <Link href="/profile" className="text-sm hover:text-primary">
                {t('navigation.profile')}
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          {session ? (
            <Button variant="outline" onClick={() => signOut()}>
              {t('navigation.signOut')}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => signIn()}>
              {t('navigation.signIn')}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
