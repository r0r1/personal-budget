'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface OAuthApp {
  id: string;
  name: string;
  description: string | null;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  createdAt: string;
  updatedAt: string;
}

export function OAuthApps() {
  const t = useTranslations();
  const [apps, setApps] = useState<OAuthApp[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    redirectUris: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const response = await fetch('/api/oauth/apps');
      if (response.ok) {
        const data = await response.json();
        setApps(data);
      }
    } catch (error) {
      console.error(t('oauth.app.errorFetch'), error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.redirectUris.trim()) {
      setError(t('oauth.app.errorRedirectUri'));
      return;
    }

    try {
      const response = await fetch('/api/oauth/apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          redirectUris: formData.redirectUris.split('\n').map(uri => uri.trim()),
        }),
      });

      if (response.ok) {
        setIsCreating(false);
        setFormData({ name: '', description: '', redirectUris: '' });
        fetchApps();
      } else {
        setError(t('oauth.app.errorCreate'));
      }
    } catch (error) {
      setError(t('oauth.app.errorCreate'));
    }
  };

  const handleDelete = async (appId: string) => {
    if (!window.confirm(t('oauth.app.deleteConfirm'))) {
      return;
    }

    try {
      const response = await fetch(`/api/oauth/apps/${appId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchApps();
      } else {
        console.error(t('oauth.app.errorDelete'));
      }
    } catch (error) {
      console.error(t('oauth.app.errorDelete'), error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('oauth.title')}</h1>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            {t('oauth.createNew')}
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{t('oauth.form.name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">{t('oauth.form.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="redirectUris">
                  {t('oauth.form.redirectUris')}
                </Label>
                <Textarea
                  id="redirectUris"
                  value={formData.redirectUris}
                  onChange={(e) =>
                    setFormData({ ...formData, redirectUris: e.target.value })
                  }
                  placeholder={t('oauth.form.redirectUrisPlaceholder')}
                  required
                />
              </div>

              {error && <p className="text-red-500">{error}</p>}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreating(false)}
                >
                  {t('oauth.form.cancelButton')}
                </Button>
                <Button type="submit">{t('oauth.form.createButton')}</Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4">
        {apps.map((app) => (
          <Card key={app.id} className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{app.name}</h3>
                {app.description && <p className="text-gray-500">{app.description}</p>}
              </div>

              <div>
                <Label>{t('oauth.app.clientId')}</Label>
                <div className="font-mono bg-muted p-2 rounded">{app.clientId}</div>
              </div>

              <div>
                <Label>{t('oauth.app.clientSecret')}</Label>
                <div className="font-mono bg-muted p-2 rounded">
                  {app.clientSecret}
                </div>
              </div>

              <div>
                <Label>{t('oauth.app.redirectUris')}</Label>
                <div className="font-mono bg-muted p-2 rounded">
                  {app.redirectUris.join('\n')}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(app.id)}
                >
                  {t('oauth.app.deleteButton')}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
