'use client';

import { useSafePathname } from '@/hooks/useSafeRouter';
import Header from '@/components/layout/Header';

export default function ConditionalHeader() {
  const pathname = useSafePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return null;
  }

  return <Header />;
} 