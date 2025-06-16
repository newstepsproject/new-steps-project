'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';

export default function ConditionalHeader() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return null;
  }

  return <Header />;
} 