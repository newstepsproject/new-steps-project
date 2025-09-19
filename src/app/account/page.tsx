'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, Package, Gift, Settings, LogOut, AlertTriangle, CheckCircle, Clock, CheckSquare, Truck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { AdminDashboardLink } from '@/components/admin/AdminDashboardLink';

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestError, setRequestError] = useState('');
  const [donations, setDonations] = useState([]);
  const [moneyDonations, setMoneyDonations] = useState([]);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [donationError, setDonationError] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Check email verification status when session is loaded
  useEffect(() => {
    if (session?.user) {
      // Use the emailVerified status from the session
      setIsEmailVerified(session.user.emailVerified || false);
      setCheckingVerification(false);
    }
  }, [session]);

  // Fetch user's requests when session is available
  useEffect(() => {
    const fetchRequests = async () => {
      if (!session?.user) return;
      
      setLoadingRequests(true);
      setRequestError('');
      
      try {
        const response = await fetch('/api/requests');
        const data = await response.json();
        
        if (response.ok) {
          setRequests(data.requests || []);
        } else {
          setRequestError(data.error || 'Failed to load requests');
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
        setRequestError('An error occurred while loading requests');
      } finally {
        setLoadingRequests(false);
      }
    };

    fetchRequests();
  }, [session]);

  // Fetch user's donations when session is available
  useEffect(() => {
    const fetchDonations = async () => {
      if (!session?.user) return;
      
      setLoadingDonations(true);
      setDonationError('');
      
      try {
        // Fetch shoe donations and money donations in parallel
        const [shoeDonationsResponse, moneyDonationsResponse] = await Promise.all([
          fetch('/api/user/donations'),
          fetch('/api/user/money-donations')
        ]);
        
        const shoeDonationsData = await shoeDonationsResponse.json();
        const moneyDonationsData = await moneyDonationsResponse.json();
        
        if (shoeDonationsResponse.ok) {
          setDonations(shoeDonationsData.donations || []);
        } else {
          console.error('Error fetching shoe donations:', shoeDonationsData.error);
        }
        
        if (moneyDonationsResponse.ok) {
          setMoneyDonations(moneyDonationsData.moneyDonations || []);
        } else {
          console.error('Error fetching money donations:', moneyDonationsData.error);
        }
        
        // Set error only if both requests failed
        if (!shoeDonationsResponse.ok && !moneyDonationsResponse.ok) {
          setDonationError('Failed to load donations');
        }
        
      } catch (error) {
        console.error('Error fetching donations:', error);
        setDonationError('An error occurred while loading donations');
      } finally {
        setLoadingDonations(false);
      }
    };

    fetchDonations();
  }, [session]);

  // Helper function to get status badge for requests
  const getRequestStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: Clock },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: CheckSquare },
      shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: Truck },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent size={12} />
        {config.label}
      </Badge>
    );
  };

  // Helper function to get status badge for donations
  const getDonationStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800', icon: Clock },
      received: { label: 'Received', color: 'bg-yellow-100 text-yellow-800', icon: Package },
      processed: { label: 'Processed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted;
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent size={12} />
        {config.label}
      </Badge>
    );
  };

  const handleSignOut = async () => {
    console.log('🚪 Logging out from account page...');
    
    try {
      // Clear all possible session storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear all cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
      }
      
      // Use NextAuth signOut but don't wait for it
      signOut({ 
        callbackUrl: '/login',
        redirect: false 
      }).catch(() => {
        // Ignore errors, we'll force redirect anyway
      });
      
      // Force immediate redirect
      setTimeout(() => {
        window.location.replace('/login');
      }, 100);
      
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if everything fails
      window.location.replace('/login');
    }
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
                >
                  <LogOut size={16} />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Activity Tabs */}
        <div className="lg:w-2/3">
          <div className="w-full max-w-none overflow-hidden">
            <Tabs defaultValue="orders" className="w-full">
              <TabsList className="grid grid-cols-2 mb-6 h-12 sticky top-0 z-10 bg-white border shadow-sm">
                <TabsTrigger value="orders" className="flex items-center gap-2 text-sm sm:text-base touch-manipulation">
                  <Package size={16} />
                  <span className="hidden sm:inline">My Requests</span>
                  <span className="sm:hidden">Requests</span>
                </TabsTrigger>
                <TabsTrigger value="donations" className="flex items-center gap-2 text-sm sm:text-base touch-manipulation">
                  <Gift size={16} />
                  <span className="hidden sm:inline">My Donations</span>
                  <span className="sm:hidden">Donations</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="orders" className="min-h-[400px] w-full max-w-none">
                <Card>
                  <CardHeader>
                    <CardTitle>My Requests</CardTitle>
                    <CardDescription>Track and manage your shoe requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingRequests ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your requests...</p>
                      </div>
                    ) : requestError ? (
                      <div className="text-center py-12 border-2 border-dashed border-red-200 rounded-lg">
                        <AlertTriangle className="mx-auto h-16 w-16 text-red-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2 text-red-600">Error Loading Requests</h3>
                        <p className="text-red-500 mb-6 px-4">{requestError}</p>
                        <Button 
                          onClick={() => window.location.reload()} 
                          size="lg" 
                          className="h-12 touch-manipulation"
                        >
                          Try Again
                        </Button>
                      </div>
                    ) : requests.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Requests Yet</h3>
                        <p className="text-gray-600 mb-6 px-4">You haven't requested any shoes yet.</p>
                        <Button asChild size="lg" className="h-12 touch-manipulation">
                          <Link href="/shoes">Browse Shoes</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {requests.map((request: any) => (
                          <Card key={request._id} className="border border-gray-200">
                            <CardContent className="p-4">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                                <div>
                                  <h3 className="font-semibold text-lg">
                                    {request.referenceId ? `Shoe Request ${request.referenceId}` : `Request ${request.requestId || request._id}`}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    Submitted on {new Date(request.createdAt).toLocaleDateString()}
                                  </p>
                                  {request.referenceId && (
                                    <div className="flex items-center mt-1">
                                      <Package className="h-4 w-4 text-brand mr-1" />
                                      <span className="text-xs font-mono text-brand font-semibold">
                                        Track: {request.referenceId}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {getRequestStatusBadge(request.currentStatus)}
                              </div>
                              
                              <div className="space-y-2">
                                <p className="text-sm text-gray-700">
                                  <strong>Items:</strong> {request.items.length} shoe{request.items.length !== 1 ? 's' : ''}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {request.items.map((item: any, index: number) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      ID: {item.shoeId} - {item.brand} {item.name}
                                    </Badge>
                                  ))}
                                </div>
                                {request.shippingFee > 0 && (
                                  <p className="text-sm text-gray-700">
                                    <strong>Shipping Fee:</strong> ${request.shippingFee}
                                  </p>
                                )}
                                {request.notes && (
                                  <p className="text-sm text-gray-700">
                                    <strong>Notes:</strong> {request.notes}
                                  </p>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="donations" className="min-h-[400px] w-full max-w-none">
                <Card>
                  <CardHeader>
                    <CardTitle>My Donations</CardTitle>
                    <CardDescription>Track and manage your donations (shoes and money)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingDonations ? (
                      <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading your donations...</p>
                      </div>
                    ) : donationError ? (
                      <div className="text-center py-12 border-2 border-dashed border-red-200 rounded-lg">
                        <AlertTriangle className="mx-auto h-16 w-16 text-red-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2 text-red-600">Error Loading Donations</h3>
                        <p className="text-red-500 mb-6 px-4">{donationError}</p>
                        <Button 
                          onClick={() => window.location.reload()} 
                          variant="outline" 
                          className="h-12 touch-manipulation"
                        >
                          Try Again
                        </Button>
                      </div>
                    ) : donations.length === 0 && moneyDonations.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <Gift className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Donations Yet</h3>
                        <p className="text-gray-600 mb-6 px-4">You haven't made any donations yet.</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button asChild size="lg" className="h-12 touch-manipulation">
                            <Link href="/donate/shoes">Donate Shoes</Link>
                          </Button>
                          <Button asChild variant="outline" size="lg" className="h-12 touch-manipulation">
                            <Link href="/get-involved">Donate Money</Link>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Money Donations Section */}
                        {moneyDonations.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-lg mb-4 text-gray-900">Money Donations</h4>
                            <div className="grid gap-4">
                              {moneyDonations.map((donation: any) => (
                                <Card key={donation._id} className="border border-gray-200">
                                  <CardContent className="p-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                                      <div>
                                        <h3 className="font-semibold text-lg">
                                          {donation.referenceId ? `Money Donation ${donation.referenceId}` : `Donation ${donation.donationId || donation._id}`}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                          Submitted on {new Date(donation.createdAt).toLocaleDateString()}
                                        </p>
                                        {donation.referenceId && (
                                          <div className="flex items-center mt-1">
                                            <Package className="h-4 w-4 text-brand mr-1" />
                                            <span className="text-xs font-mono text-brand font-semibold">
                                              Track: {donation.referenceId}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      {getDonationStatusBadge(donation.status)}
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <p className="text-sm text-gray-700">
                                        <strong>Amount:</strong> ${donation.amount.toFixed(2)}
                                      </p>
                                      {donation.checkNumber && (
                                        <p className="text-sm text-gray-700">
                                          <strong>Check Number:</strong> {donation.checkNumber}
                                        </p>
                                      )}
                                      {donation.notes && (
                                        <p className="text-sm text-gray-700">
                                          <strong>Notes:</strong> {donation.notes}
                                        </p>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Shoe Donations Section */}
                        {donations.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-lg mb-4 text-gray-900">Shoe Donations</h4>
                            <div className="grid gap-4">
                              {donations.map((donation: any) => (
                                <Card key={donation._id} className="border border-gray-200">
                                  <CardContent className="p-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                                      <div>
                                        <h3 className="font-semibold text-lg">
                                          {donation.referenceId ? `Shoe Donation ${donation.referenceId}` : `Donation ${donation.donationId || donation._id}`}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                          Submitted on {new Date(donation.createdAt).toLocaleDateString()}
                                        </p>
                                        {donation.referenceId && (
                                          <div className="flex items-center mt-1">
                                            <Package className="h-4 w-4 text-brand mr-1" />
                                            <span className="text-xs font-mono text-brand font-semibold">
                                              Track: {donation.referenceId}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      {getDonationStatusBadge(donation.status)}
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <p className="text-sm text-gray-700">
                                        <strong>Shoes:</strong> {donation.numberOfShoes} pair{donation.numberOfShoes !== 1 ? 's' : ''}
                                      </p>
                                      <p className="text-sm text-gray-700">
                                        <strong>Description:</strong> {donation.donationDescription || 'No description provided'}
                                      </p>
                                      {donation.notes && (
                                        <p className="text-sm text-gray-700">
                                          <strong>Notes:</strong> {donation.notes}
                                        </p>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
