'use client';

import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut } from 'lucide-react';
import Link from 'next/link';

export default function SignOutPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <LogOut className="mx-auto h-12 w-12 text-brand-500 mb-4" />
          <CardTitle className="text-2xl">Sign Out</CardTitle>
          <p className="text-gray-600">Are you sure you want to sign out?</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {session?.user && (
            <p className="text-sm text-gray-700">
              Signed in as: <span className="font-medium">{session.user.email}</span>
            </p>
          )}

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleSignOut}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Signing out...' : 'Yes, Sign Out'}
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}