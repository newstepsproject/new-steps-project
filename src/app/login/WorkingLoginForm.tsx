'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FcGoogle } from 'react-icons/fc';
import { Loader2 } from 'lucide-react';

export default function WorkingLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('/account');

  // If already logged in, redirect immediately
  useEffect(() => {
    if (status === 'authenticated' && session) {
      console.log('✅ Already authenticated, redirecting...');
      router.push(callbackUrl);
    }
  }, [status, session, router, callbackUrl]);

  useEffect(() => {
    const callback = searchParams.get('callbackUrl');
    if (callback) {
      setCallbackUrl(decodeURIComponent(callback));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔑 Attempting login with NextAuth signIn...');
      
      const result = await signIn('credentials', {
        redirect: false, // Handle redirect manually
        email,
        password,
      });

      console.log('🔍 NextAuth signIn result:', result);

      if (result?.error) {
        console.error('❌ NextAuth signIn error:', result.error);
        setError(result.error === 'CredentialsSignin' ? 'Invalid email or password.' : 'Login failed. Please try again.');
      } else if (result?.ok) {
        console.log('✅ Login successful, redirecting to:', callbackUrl);
        // Successful login - NextAuth will handle session creation
        router.push(callbackUrl);
      } else {
        console.error('❌ Unexpected signIn result:', result);
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      console.error('❌ Login exception:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      console.log('🔑 Attempting Google OAuth login...');
      await signIn('google', { callbackUrl: callbackUrl || '/account' });
    } catch (err) {
      console.error('❌ Google sign-in error:', err);
      setError('Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render form if already authenticated
  if (status === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

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
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
              <Input
                id="password"
                type="password"
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
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Or continue with</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full mt-4 h-12 min-h-[44px] touch-manipulation"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <FcGoogle className="mr-2 h-5 w-5" />
              Sign in with Google
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center">
            <Link href="/forgot-password" className="text-brand hover:text-brand/80">
              Forgot your password?
            </Link>
          </div>
          <div className="text-sm text-center">
            Don&apos;t have an account?{' '}
            <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-brand hover:text-brand/80">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
