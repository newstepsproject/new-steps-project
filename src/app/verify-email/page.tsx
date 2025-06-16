'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

// Create a separate component that uses the search params
function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [verificationState, setVerificationState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setVerificationState('error');
      setMessage('No verification token provided. Please check your email link and try again.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/verify?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setVerificationState('success');
          setMessage(data.message || 'Your email has been verified successfully!');
        } else {
          setVerificationState('error');
          setMessage(data.message || 'Failed to verify your email. The token may be invalid or expired.');
        }
      } catch (error) {
        setVerificationState('error');
        setMessage('An error occurred while verifying your email. Please try again later.');
        console.error('Verification error:', error);
      }
    };

    verifyToken();
  }, [token]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
        <CardDescription className="text-center">
          {verificationState === 'loading' ? 'Verifying your email address' : 
            verificationState === 'success' ? 'Email verified successfully' : 
            'Verification failed'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
        {verificationState === 'loading' ? (
          <Loader2 className="h-16 w-16 text-brand animate-spin mb-4" />
        ) : verificationState === 'success' ? (
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
        ) : (
          <XCircle className="h-16 w-16 text-red-500 mb-4" />
        )}
        <p className="text-center text-muted-foreground mt-2">
          {message}
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        {verificationState === 'success' ? (
          <Button onClick={() => router.push('/login')}>
            Login to your account
          </Button>
        ) : verificationState === 'error' ? (
          <div className="flex flex-col items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/login">Go to login</Link>
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              <Link href="/resend-verification" className="text-brand hover:underline">
                Resend verification email
              </Link>
            </p>
          </div>
        ) : null}
      </CardFooter>
    </Card>
  );
}

// Main component with suspense boundary
export default function VerifyEmailPage() {
  return (
    <div className="container mx-auto py-10 flex justify-center">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
            <CardDescription className="text-center">Loading verification page...</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-6 pb-8">
            <Loader2 className="h-16 w-16 text-brand animate-spin mb-4" />
            <p className="text-center text-muted-foreground mt-2">
              Please wait while we load the verification page...
            </p>
          </CardContent>
        </Card>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
} 