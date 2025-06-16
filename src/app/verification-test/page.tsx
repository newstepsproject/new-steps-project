'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerificationTestPage() {
  // User registration state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registerResult, setRegisterResult] = useState<any>(null);
  const [verificationToken, setVerificationToken] = useState('');

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [tokenToVerify, setTokenToVerify] = useState('');

  // User check state
  const [checkingUser, setCheckingUser] = useState(false);
  const [userCheckResult, setUserCheckResult] = useState<any>(null);
  const [emailToCheck, setEmailToCheck] = useState('');

  // Database setup state
  const [setupDbResult, setSetupDbResult] = useState<any>(null);
  const [settingUpDb, setSettingUpDb] = useState(false);

  /**
   * Register a new user
   */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    setRegisterResult(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password, phone })
      });

      const result = await response.json();
      
      setRegisterResult({
        success: response.ok,
        status: response.status,
        data: result
      });

      if (response.ok) {
        // Clear form after successful registration
        setName('');
        setEmail('');
        setPassword('');
        setPhone('');
      }
    } catch (error) {
      setRegisterResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setRegistering(false);
    }
  };

  /**
   * Verify an email token
   */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyResult(null);

    try {
      const response = await fetch(`/api/auth/verify?token=${tokenToVerify}`);
      const result = await response.json();
      
      setVerifyResult({
        success: response.ok,
        status: response.status,
        data: result
      });

      if (response.ok) {
        setTokenToVerify('');
      }
    } catch (error) {
      setVerifyResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setVerifying(false);
    }
  };

  /**
   * Check user verification status
   */
  const checkUserStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingUser(true);
    setUserCheckResult(null);

    try {
      const response = await fetch(`/api/auth/verification-test?email=${encodeURIComponent(emailToCheck)}`);
      const result = await response.json();
      
      setUserCheckResult({
        success: response.ok,
        status: response.status,
        data: result
      });
    } catch (error) {
      setUserCheckResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setCheckingUser(false);
    }
  };

  /**
   * Check health status of the API
   */
  const checkHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      return {
        success: response.ok,
        status: response.status,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };

  /**
   * Set up in-memory database for testing
   */
  const setupMemoryDatabase = async () => {
    setSettingUpDb(true);
    setSetupDbResult(null);

    try {
      // First check health status
      const health = await checkHealth();
      
      // If database is already connected, we're good
      if (health.success && health.data.databaseConnection === 'connected') {
        setSetupDbResult({
          success: true,
          message: 'Database is already connected',
          data: health.data
        });
        return;
      }

      // Otherwise, we need to use the in-memory database
      // Check if our environment is set up for it
      const envVars = {
        USE_MEMORY_DB: process.env.NEXT_PUBLIC_USE_MEMORY_DB || 'false',
        TEST_MODE: process.env.NEXT_PUBLIC_TEST_MODE || 'false'
      };

      // Only inform the user about the environment status
      setSetupDbResult({
        success: envVars.USE_MEMORY_DB === 'true',
        message: envVars.USE_MEMORY_DB === 'true' 
          ? 'Environment is correctly set up for in-memory database. Please restart the server with proper environment variables.' 
          : 'Environment is not set up for in-memory database. Please set USE_MEMORY_DB=true and TEST_MODE=true in your environment.',
        envVars,
        healthCheck: health.data
      });
    } catch (error) {
      setSetupDbResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setSettingUpDb(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-16 px-4">
      <div className="mb-8 space-y-3">
        <h1 className="text-3xl font-bold">Email Verification Testing</h1>
        <p className="text-gray-600">Test the email verification flow using the forms below.</p>
      </div>
      
      <Tabs defaultValue="setup">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Setup</TabsTrigger>
          <TabsTrigger value="register">Register User</TabsTrigger>
          <TabsTrigger value="verify">Verify Email</TabsTrigger>
          <TabsTrigger value="check">Check User Status</TabsTrigger>
        </TabsList>
        
        {/* Setup Tab */}
        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>Database Setup</CardTitle>
              <CardDescription>
                Check database connection status and set up in-memory database for testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  onClick={checkHealth} 
                  variant="secondary"
                  className="mr-2"
                >
                  Check Health Status
                </Button>
                
                <Button 
                  onClick={setupMemoryDatabase} 
                  disabled={settingUpDb}
                >
                  {settingUpDb ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting Up...
                    </>
                  ) : (
                    'Setup In-Memory Database'
                  )}
                </Button>
                
                {setupDbResult && (
                  <div className="mt-4">
                    {setupDbResult.success ? (
                      <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">Database Setup</AlertTitle>
                        <AlertDescription className="text-green-700">
                          {setupDbResult.message}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert className="bg-red-50 border-red-200">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertTitle className="text-red-800">Database Setup Failed</AlertTitle>
                        <AlertDescription className="text-red-700">
                          {setupDbResult.message || setupDbResult.error || 'Unknown error occurred'}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                      <h3 className="font-medium mb-2">Details:</h3>
                      <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded">
                        {JSON.stringify(setupDbResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Registration Tab */}
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Register New User</CardTitle>
              <CardDescription>
                Fill out the form to register a new user and generate a verification token
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="********"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="(123) 456-7890"
                  />
                </div>
                <Button type="submit" disabled={registering} className="w-full">
                  {registering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    'Register User'
                  )}
                </Button>
              </form>
            </CardContent>
            {registerResult && (
              <CardFooter>
                <div className="w-full">
                  {registerResult.success ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">Registration Successful</AlertTitle>
                      <AlertDescription className="text-green-700">
                        User registered successfully! Check the email for verification link.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-red-50 border-red-200">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-800">Registration Failed</AlertTitle>
                      <AlertDescription className="text-red-700">
                        {registerResult.data?.message || registerResult.error || 'Unknown error occurred'}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium mb-2">Response Details:</h3>
                    <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded">
                      {JSON.stringify(registerResult, null, 2)}
                    </pre>
                  </div>
                  
                  {registerResult.data?.token && (
                    <div className="mt-4">
                      <p className="font-medium mb-2">Verification Token:</p>
                      <div className="flex gap-2">
                        <Input 
                          value={registerResult.data.token} 
                          readOnly 
                          onClick={(e) => e.currentTarget.select()}
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setTokenToVerify(registerResult.data.token);
                            document.querySelector('[data-value="verify"]')?.dispatchEvent(
                              new MouseEvent('click', { bubbles: true })
                            );
                          }}
                        >
                          Use Token
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        {/* Verification Tab */}
        <TabsContent value="verify">
          <Card>
            <CardHeader>
              <CardTitle>Verify Email</CardTitle>
              <CardDescription>
                Enter a verification token to verify a user's email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token">Verification Token</Label>
                  <Input
                    id="token"
                    value={tokenToVerify}
                    onChange={(e) => setTokenToVerify(e.target.value)}
                    required
                    placeholder="Enter verification token"
                  />
                </div>
                <Button type="submit" disabled={verifying} className="w-full">
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Email'
                  )}
                </Button>
              </form>
            </CardContent>
            {verifyResult && (
              <CardFooter>
                <div className="w-full">
                  {verifyResult.success ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">Verification Successful</AlertTitle>
                      <AlertDescription className="text-green-700">
                        Email has been verified successfully!
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-red-50 border-red-200">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-800">Verification Failed</AlertTitle>
                      <AlertDescription className="text-red-700">
                        {verifyResult.data?.error || verifyResult.error || 'Unknown error occurred'}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium mb-2">Response Details:</h3>
                    <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded">
                      {JSON.stringify(verifyResult, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        {/* Check User Status Tab */}
        <TabsContent value="check">
          <Card>
            <CardHeader>
              <CardTitle>Check User Status</CardTitle>
              <CardDescription>
                Check if a user exists and whether their email is verified
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={checkUserStatus} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="check-email">Email</Label>
                  <Input
                    id="check-email"
                    type="email"
                    value={emailToCheck}
                    onChange={(e) => setEmailToCheck(e.target.value)}
                    required
                    placeholder="john@example.com"
                  />
                </div>
                <Button type="submit" disabled={checkingUser} className="w-full">
                  {checkingUser ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    'Check User Status'
                  )}
                </Button>
              </form>
            </CardContent>
            {userCheckResult && (
              <CardFooter>
                <div className="w-full">
                  {userCheckResult.success ? (
                    <Alert className={userCheckResult.data?.user ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}>
                      {userCheckResult.data?.user ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-yellow-600" />
                      )}
                      <AlertTitle className={userCheckResult.data?.user ? "text-green-800" : "text-yellow-800"}>
                        {userCheckResult.data?.user ? "User Found" : "User Not Found"}
                      </AlertTitle>
                      <AlertDescription className={userCheckResult.data?.user ? "text-green-700" : "text-yellow-700"}>
                        {userCheckResult.data?.user 
                          ? `User exists. Email verification status: ${userCheckResult.data.user.emailVerified ? 'Verified' : 'Not Verified'}`
                          : `No user found with email: ${emailToCheck}`
                        }
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="bg-red-50 border-red-200">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-800">Check Failed</AlertTitle>
                      <AlertDescription className="text-red-700">
                        {userCheckResult.data?.error || userCheckResult.error || 'Unknown error occurred'}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium mb-2">Response Details:</h3>
                    <pre className="text-xs overflow-auto p-2 bg-gray-100 rounded">
                      {JSON.stringify(userCheckResult, null, 2)}
                    </pre>
                  </div>

                  {userCheckResult.data?.user && !userCheckResult.data.user.emailVerified && (
                    <div className="mt-4">
                      <Button
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/auth/resend-verification', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({ email: emailToCheck })
                            });
                            
                            const result = await response.json();
                            alert(result.message || 'Verification email resent');
                          } catch (error) {
                            alert('Failed to resend verification email');
                            console.error(error);
                          }
                        }}
                      >
                        Resend Verification Email
                      </Button>
                    </div>
                  )}
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <Link href="/" className="text-brand hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
} 