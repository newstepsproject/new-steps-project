'use client';

import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export function AdminDashboardLink() {
  const { data: session } = useSession();

  if (!session?.user?.role || session.user.role !== 'admin') {
    return null;
  }

  return (
    <Button 
      variant="outline" 
      className="w-full flex items-center gap-2 text-brand hover:text-brand-600 md:col-span-2"
      asChild
    >
      <Link href="/admin">
        <LayoutDashboard size={16} />
        Admin Dashboard
      </Link>
    </Button>
  );
} 