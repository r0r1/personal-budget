import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
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

export default function OAuthApps() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apps, setApps] = useState<OAuthApp[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    redirectUris: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (status === 'authenticated') {
      fetchApps();
    }
  }, [status, router]);

  const fetchApps = async () => {
    try {
      const response = await fetch('/api/oauth/apps');
      if (response.ok) {
        const data = await response.json();
        setApps(data);
      }
    } catch (error) {
      console.error('Error fetching apps:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const redirectUris = formData.redirectUris
        .split('\n')
        .map(uri => uri.trim())
        .filter(uri => uri);

      if (redirectUris.length === 0) {
        setError('At least one redirect URI is required');
        return;
      }

      const response = await fetch('/api/oauth/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          redirectUris,
        }),
      });

      if (response.ok) {
        setFormData({ name: '', description: '', redirectUris: '' });
        setIsCreating(false);
        fetchApps();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create OAuth app');
      }
    } catch (error) {
      console.error('Error creating app:', error);
      setError('Failed to create OAuth app');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this OAuth app?')) {
      return;
    }

    try {
      const response = await fetch(`/api/oauth/apps?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchApps();
      }
    } catch (error) {
      console.error('Error deleting app:', error);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">OAuth Applications</h1>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          Create New App
        </Button>
      </div>

      {isCreating && (
        <Card className="p-6 mb-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Application Name</Label>
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
                <Label htmlFor="description">Description</Label>
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
                  Redirect URIs (one per line)
                </Label>
                <Textarea
                  id="redirectUris"
                  value={formData.redirectUris}
                  onChange={(e) =>
                    setFormData({ ...formData, redirectUris: e.target.value })
                  }
                  placeholder="https://example.com/callback"
                  required
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-2">
                <Button type="submit">Create Application</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setFormData({ name: '', description: '', redirectUris: '' });
                    setError('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {apps.map((app) => (
          <Card key={app.id} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{app.name}</h2>
                {app.description && (
                  <p className="text-gray-600 mt-1">{app.description}</p>
                )}
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(app.id)}
              >
                Delete
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              <div>
                <Label>Client ID</Label>
                <Input value={app.clientId} readOnly />
              </div>
              <div>
                <Label>Client Secret</Label>
                <Input value={app.clientSecret} type="password" readOnly />
              </div>
              <div>
                <Label>Redirect URIs</Label>
                <ul className="list-disc list-inside text-sm">
                  {app.redirectUris.map((uri, index) => (
                    <li key={index} className="text-gray-600">
                      {uri}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
