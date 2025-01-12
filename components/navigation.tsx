import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from './ui/button';

export function Navigation() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex">
            <Link href="/" className="flex items-center px-2 text-lg font-semibold">
              Personal Budget
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link href="/" passHref>
              <Button variant="ghost">Dashboard</Button>
            </Link>
            <Link href="/profile" passHref>
              <Button variant="ghost">Profile</Button>
            </Link>
            <Link href="/oauth/apps" passHref>
              <Button variant="ghost">OAuth Apps</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
