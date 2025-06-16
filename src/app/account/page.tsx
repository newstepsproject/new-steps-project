'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Package, Gift, Settings, LogOut, AlertTriangle, CheckCircle } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { AdminDashboardLink } from '@/components/admin/AdminDashboardLink';

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Check email verification status when session is loaded
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!session?.user?.email) return;
      
      try {
        // In a real app, this would be an API call to check the verification status
        // For now, we'll simulate this by setting it to false
        // Replace this with an actual API call to check the status in your production app
        setIsEmailVerified(false);
        setCheckingVerification(false);
      } catch (error) {
        console.error('Error checking verification status:', error);
        setCheckingVerification(false);
      }
    };

    if (session?.user) {
      checkVerificationStatus();
    }
  }, [session]);

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: '/' });
  };

  const handleResendVerification = async () => {
    if (!session?.user?.email) return;
    
    setIsResendingVerification(true);
    setVerificationMessage('');
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: session.user.email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setVerificationMessage('Verification email sent! Please check your inbox.');
      } else {
        setVerificationMessage(data.message || 'Failed to resend verification email.');
      }
    } catch (error) {
      setVerificationMessage('An error occurred. Please try again.');
      console.error('Error resending verification email:', error);
    } finally {
      setIsResendingVerification(false);
    }
  };

  if (status === 'loading' || checkingVerification) {
    return (
      <div className="container px-4 py-12 flex items-center justify-center min-h-[calc(100vh-250px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // This will prevent any flash before the redirect happens
  }

  return (
    <div className="container px-4 py-8 md:py-12 pb-24 md:pb-12">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Profile Section */}
        <div className="lg:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>My Account</CardTitle>
              <CardDescription>Manage your account settings and preferences</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-brand/10 text-brand flex items-center justify-center">
                <User className="h-12 w-12" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold">{session.user?.name || 'User'}</h2>
                <p className="text-gray-600">{session.user?.email}</p>
              </div>
              
              {/* Email verification status */}
              {isEmailVerified ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Email verified</span>
                </div>
              ) : (
                <div className="w-full">
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Email not verified</AlertTitle>
                    <AlertDescription className="text-amber-700">
                      <p className="mb-3">Please verify your email to access all features.</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleResendVerification}
                        disabled={isResendingVerification}
                        className="text-amber-700 border-amber-300 hover:bg-amber-100 w-full sm:w-auto"
                      >
                        {isResendingVerification ? 'Sending...' : 'Resend verification email'}
                      </Button>
                      {verificationMessage && (
                        <p className="mt-3 text-sm font-medium">{verificationMessage}</p>
                      )}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              <div className="w-full space-y-3">
                <Button variant="outline" className="w-full h-12 flex items-center gap-2 touch-manipulation">
                  <Settings size={16} />
                  Edit Profile
                </Button>
                
                {/* Admin Dashboard Link - will only show for admin users */}
                <AdminDashboardLink />
                
                <Button 
                  variant="outline" 
                  className="w-full h-12 flex items-center gap-2 text-red-500 hover:text-red-600 touch-manipulation"
                  onClick={handleSignOut}
                  disabled={isLoading}
                >
                  <LogOut size={16} />
                  {isLoading ? 'Signing out...' : 'Sign Out'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Activity Tabs */}
        <div className="lg:w-2/3">
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6 h-12">
              <TabsTrigger value="orders" className="flex items-center gap-2 text-sm sm:text-base touch-manipulation">
                <Package size={16} />
                <span className="hidden sm:inline">My Orders</span>
                <span className="sm:hidden">Orders</span>
              </TabsTrigger>
              <TabsTrigger value="donations" className="flex items-center gap-2 text-sm sm:text-base touch-manipulation">
                <Gift size={16} />
                <span className="hidden sm:inline">My Donations</span>
                <span className="sm:hidden">Donations</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>My Orders</CardTitle>
                  <CardDescription>Track and manage your shoe orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Orders Yet</h3>
                    <p className="text-gray-600 mb-6 px-4">You haven't requested any shoes yet.</p>
                    <Button asChild size="lg" className="h-12 touch-manipulation">
                      <Link href="/shoes">Browse Shoes</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="donations">
              <Card>
                <CardHeader>
                  <CardTitle>My Donations</CardTitle>
                  <CardDescription>Track and manage your shoe donations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <Gift className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Donations Yet</h3>
                    <p className="text-gray-600 mb-6 px-4">You haven't donated any shoes yet.</p>
                    <Button asChild size="lg" className="h-12 touch-manipulation">
                      <Link href="/donate/shoes">Donate Shoes</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
