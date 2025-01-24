'use client';

import { useTranslations } from 'next-intl';
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileViewProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function ProfileView({ user }: ProfileViewProps) {
  const t = useTranslations();

  return (
    <div className="container mx-auto py-10">
      <Card className="p-6 max-w-2xl mx-auto">
        <div className="flex items-start space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.image || ''} />
            <AvatarFallback>
              {user.name?.charAt(0) || user.email?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">
              {user.name || t('profile.noName')}
            </h2>
            <p className="text-gray-500">
              {user.email || t('profile.noEmail')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}