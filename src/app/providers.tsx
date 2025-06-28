'use client';

import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/components/cart/CartProvider';
import { useEffect } from 'react';
import { errorHandler } from '@/lib/error-handler';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize error handler on client side
    console.log('Error handler initialized');
  }, []);

  return (
    <SessionProvider>
      <CartProvider>
        <ClientLayout>
          {children}
          <MobileBottomNav />
        </ClientLayout>
      </CartProvider>
    </SessionProvider>
  );
} 