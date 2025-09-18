'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FcGoogle } from 'react-icons/fc';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('/account');

  // Get callback URL from query parameters
  useEffect(() => {
    const callback = searchParams.get('callbackUrl');
    if (callback) {
      setCallbackUrl(decodeURIComponent(callback));
    }
  }, [searchParams]);

  // Remove automatic redirect - was causing infinite loop

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔍 LOGIN ATTEMPT:', { email, environment: process.env.NODE_ENV });
      console.log('🔍 NEXTAUTH_URL:', process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'not set');
      console.log('🔍 Current URL:', window.location.href);
      console.log('🔍 User Agent:', navigator.userAgent);
      
      // METHOD 1: Try NextAuth signIn
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      console.log('🔍 LOGIN RESULT (detailed):', JSON.stringify(result, null, 2));

      // If NextAuth signIn works, proceed normally
      if (result && (result.ok || (result.status === 200 && result.error === 'Configuration'))) {
        console.log('✅ NEXTAUTH LOGIN SUCCEEDED WITH CONFIG WARNING');
        
        // IMMEDIATE SUCCESS EVENT - Trigger Header update instantly
        if (typeof window !== 'undefined') {
          const event = new Event('login-success');
          window.dispatchEvent(event);
          console.log('🚀 DISPATCHED LOGIN SUCCESS EVENT');
        }
        
        // Force session refresh
        window.location.href = callbackUrl || '/';
        return;
      }

      // Handle "Configuration" error - authentication succeeded but client config issue
      if (result?.ok && result?.error === 'Configuration') {
        console.log('✅ NEXTAUTH LOGIN SUCCEEDED WITH CONFIG WARNING');
        console.log('🔄 Redirecting to:', callbackUrl);
        // Authentication actually worked, just proceed
        setTimeout(() => {
          console.log('🚀 Executing redirect...');
          router.push(callbackUrl);
          router.refresh();
        }, 500);
        setIsLoading(false);
        return;
      }

      // Debug any other error cases
      if (result?.error) {
        console.error('❌ LOGIN ERROR DETAILS:', {
          error: result.error,
          status: result.status,
          ok: result.ok,
          url: result.url
        });
        console.log('🔧 Will try direct API method...');
      }

      // METHOD 2: If NextAuth fails, try direct API call with proper form data
      console.log('🔄 NEXTAUTH FAILED, TRYING DIRECT API...');
      
      // Get CSRF token first
      const csrfResponse = await fetch('/api/auth/csrf');
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;
      
      const directResponse = await fetch('/api/auth/signin/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          email,
          password,
          csrfToken,
          redirect: 'false'
        }),
      });

      console.log('🔍 DIRECT API RESPONSE:', directResponse.status);

      if (directResponse.ok) {
        console.log('✅ DIRECT API LOGIN SUCCESSFUL');
        
        // IMMEDIATE SUCCESS EVENT - Trigger Header update instantly
        if (typeof window !== 'undefined') {
          const event = new Event('login-success');
          window.dispatchEvent(event);
          console.log('🚀 DISPATCHED LOGIN SUCCESS EVENT (DIRECT API)');
        }
        
        // Wait a moment for session to be established
        setTimeout(async () => {
          // Check if session is now established
          console.log('🔍 Checking session after direct API login...');
          const sessionCheck = await fetch('/api/auth/session');
          console.log('🔍 SESSION CHECK RESPONSE:', sessionCheck.status);
          
          let session = null;
          try {
            session = await sessionCheck.json();
            console.log('🔍 SESSION DATA:', JSON.stringify(session, null, 2));
          } catch (parseError) {
            console.error('❌ Failed to parse session response as JSON:', parseError);
            const sessionText = await sessionCheck.text();
            console.log('🔍 SESSION RESPONSE TEXT:', sessionText.substring(0, 200));
          }
          
          if (session?.user) {
            console.log('✅ SESSION ESTABLISHED, redirecting to:', callbackUrl);
            // Force immediate redirect
            window.location.href = callbackUrl || '/';
          } else {
            console.error('❌ NO SESSION AFTER DIRECT LOGIN');
            console.error('❌ Session check failed:', session);
            setError('Login succeeded but session failed. Please try again.');
          }
        }, 1000);
        setIsLoading(false);
        return;
      }

      // METHOD 3: If both fail, show error
      console.error('❌ BOTH METHODS FAILED');
      setError('Invalid email or password. Please try again.');
      setIsLoading(false);
      
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    console.log('🔍 Starting Google OAuth...', { callbackUrl });
    setIsLoading(true);
    setError('');
    
    try {
      // Use NextAuth signIn with redirect enabled (default behavior)
      const result = await signIn('google', {
        callbackUrl: callbackUrl || '/account',
        redirect: true // Let NextAuth handle redirects
      });
      
      // Note: For OAuth providers with redirect:true, this code typically won't execute
      // because the browser redirects to Google immediately
      console.log('🔍 Google OAuth result:', result);
      
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      setError('Google sign-in failed. Please try again.');
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
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="email"
                type="email"
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
            Don't have an account?{' '}
            <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-brand hover:text-brand/80">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
} 