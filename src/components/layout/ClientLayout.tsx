'use client';

import React from 'react';
import ConditionalHeader from '@/components/layout/ConditionalHeader';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen">
        <ConditionalHeader />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </ErrorBoundary>
  );
} 