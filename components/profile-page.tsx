'use client';

import { useSession } from "next-auth/react";
import { useTranslations } from 'next-intl';
import { Card } from "@/components/ui/card";

export function ProfilePage() {
  const { data: session } = useSession();
  const t = useTranslations();

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t('profile.title')}</h1>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{t('profile.accountDetails')}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500">{t('profile.name')}</label>
            <p className="mt-1">{session?.user?.name || t('profile.noName')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500">{t('profile.email')}</label>
            <p className="mt-1">{session?.user?.email || t('profile.noEmail')}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
