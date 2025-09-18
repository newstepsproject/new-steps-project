'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SimpleLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/account';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔍 Simple login attempt:', { email });
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('🔍 Login result:', result);

      if (result?.ok) {
        console.log('✅ Login successful, redirecting...');
        window.location.href = callbackUrl;
        return;
      }

      if (result?.error === 'CredentialsSignin') {
        setError('Invalid email or password');
      } else if (result?.error) {
        setError(`Login failed: ${result.error}`);
      } else {
        setError('Login failed. Please try again.');
      }

    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError('Google sign-in failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 min-h-[44px] touch-manipulation"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 min-h-[44px] touch-manipulation"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              Sign in with Google
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                href={`/register${callbackUrl !== '/account' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
                className="font-medium text-brand hover:underline"
              >
                Create one here
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-gray-600 hover:text-brand"
            >
              Forgot your password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
