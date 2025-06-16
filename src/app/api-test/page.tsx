'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function ApiTestPage() {
  const [databaseStatus, setDatabaseStatus] = useState<{
    loading: boolean;
    data: any;
    error: string | null;
  }>({
    loading: false,
    data: null,
    error: null,
  });

  const [fullTestStatus, setFullTestStatus] = useState<{
    loading: boolean;
    data: any;
    error: string | null;
  }>({
    loading: false,
    data: null,
    error: null,
  });

  const testDatabaseConnection = async () => {
    setDatabaseStatus({ loading: true, data: null, error: null });
    try {
      const response = await fetch('/api/health/database');
      const data = await response.json();
      setDatabaseStatus({ loading: false, data, error: null });
    } catch (error) {
      setDatabaseStatus({ 
        loading: false, 
        data: null, 
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };

  const runFullDatabaseTest = async () => {
    setFullTestStatus({ loading: true, data: null, error: null });
    try {
      const response = await fetch('/api/health/database-test');
      const data = await response.json();
      setFullTestStatus({ loading: false, data, error: null });
    } catch (error) {
      setFullTestStatus({ 
        loading: false, 
        data: null, 
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">API Test Dashboard</h1>
      
      <Tabs defaultValue="database">
        <TabsList className="mb-4">
          <TabsTrigger value="database">Database Tests</TabsTrigger>
          <TabsTrigger value="other">Other API Tests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="database">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Database Connection Test */}
            <Card>
              <CardHeader>
                <CardTitle>Database Connection Test</CardTitle>
                <CardDescription>
                  Tests the basic MongoDB connection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={testDatabaseConnection} 
                  disabled={databaseStatus.loading}
                >
                  {databaseStatus.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Connection
                </Button>
                
                {databaseStatus.data && (
                  <div className="mt-4">
                    <Alert variant={databaseStatus.data.success ? "default" : "destructive"}>
                      <div className="flex items-center gap-2">
                        {databaseStatus.data.success ? 
                          <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                          <XCircle className="h-4 w-4 text-red-500" />
                        }
                        <AlertTitle>
                          {databaseStatus.data.success ? 'Success' : 'Error'}
                        </AlertTitle>
                      </div>
                      <AlertDescription>
                        {databaseStatus.data.message}
                      </AlertDescription>
                    </Alert>
                    
                    {databaseStatus.data.success && (
                      <div className="mt-4 text-sm">
                        <h4 className="font-medium mb-2">Connection Details:</h4>
                        <pre className="bg-slate-100 p-2 rounded overflow-auto">
                          {JSON.stringify(databaseStatus.data.connection, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
                
                {databaseStatus.error && (
                  <Alert variant="destructive" className="mt-4">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Request Error</AlertTitle>
                    <AlertDescription>{databaseStatus.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            {/* Full Database Test */}
            <Card>
              <CardHeader>
                <CardTitle>Full Database Test</CardTitle>
                <CardDescription>
                  Tests connection, user model operations, and data validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={runFullDatabaseTest} 
                  disabled={fullTestStatus.loading}
                >
                  {fullTestStatus.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Run Full Database Test
                </Button>
                
                {fullTestStatus.data && (
                  <div className="mt-4">
                    <Alert variant={fullTestStatus.data.success ? "default" : "destructive"}>
                      <div className="flex items-center gap-2">
                        {fullTestStatus.data.success ? 
                          <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                          <XCircle className="h-4 w-4 text-red-500" />
                        }
                        <AlertTitle>
                          {fullTestStatus.data.success ? 'Success' : 'Error'}
                        </AlertTitle>
                      </div>
                      <AlertDescription>
                        {fullTestStatus.data.message}
                      </AlertDescription>
                    </Alert>
                    
                    {fullTestStatus.data.connectionTest && (
                      <div className="mt-4 text-sm">
                        <h4 className="font-medium mb-2">Connection Test:</h4>
                        <pre className="bg-slate-100 p-2 rounded overflow-auto">
                          {JSON.stringify(fullTestStatus.data.connectionTest, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {fullTestStatus.data.userModelTest && (
                      <div className="mt-4 text-sm">
                        <h4 className="font-medium mb-2">User Model Test:</h4>
                        <pre className="bg-slate-100 p-2 rounded overflow-auto">
                          {JSON.stringify(fullTestStatus.data.userModelTest, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
                
                {fullTestStatus.error && (
                  <Alert variant="destructive" className="mt-4">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Request Error</AlertTitle>
                    <AlertDescription>{fullTestStatus.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="other">
          <Card>
            <CardHeader>
              <CardTitle>Other API Tests</CardTitle>
              <CardDescription>
                Additional API endpoint testing will be added here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>No additional API tests implemented yet.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 