'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the global error
    console.error('Global Error:', error);
    
    // Send critical error to monitoring service
    if (typeof window !== 'undefined') {
      fetch('/api/client-errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.toString(),
          stack: error.stack,
          digest: error.digest,
          type: 'global-error',
          url: window.location.href
        })
      }).catch(console.error);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-red-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center border border-red-200">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-16 w-16 text-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Critical Error</h1>
            
            <p className="text-gray-600 mb-6">
              A critical error occurred that prevented the application from loading properly. 
              Please refresh the page or contact support if the problem persists.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
                  Error details (development only)
                </summary>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto whitespace-pre-wrap">
                  {error.toString()}
                  {error.stack && `\n\nStack trace:\n${error.stack}`}
                  {error.digest && `\n\nError ID: ${error.digest}`}
                </pre>
              </details>
            )}
            
            <div className="space-y-3">
              <Button onClick={reset} className="w-full bg-red-600 hover:bg-red-700">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Reload Application
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
} 