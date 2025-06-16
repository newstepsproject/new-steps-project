'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, 
  Users, 
  BarChart3, 
  Settings,
  LogOut, 
  DollarSign,
  Home,
  User,
  ExternalLink,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import MobileNav from '@/components/admin/MobileNav';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Shoe Donations', href: '/admin/shoe-donations', icon: Package },
  { name: 'Money Donations', href: '/admin/money-donations', icon: DollarSign },
  { name: 'Shoe Inventory', href: '/admin/shoes', icon: Package },
  { name: 'Shoe Requests', href: '/admin/requests', icon: Users },
  { name: 'Users', href: '/admin/users', icon: User },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    redirect('/login');
  }

  // Redirect to home if not admin
  if (!session?.user?.role || session.user.role !== 'admin') {
    console.log('User role:', session?.user?.role);
    redirect('/');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r">
            <div className="flex items-center flex-shrink-0 px-4">
              <Link href="/admin">
                <h1 className="text-xl font-bold text-gray-900 cursor-pointer hover:text-brand">Admin Dashboard</h1>
              </Link>
            </div>
            <div className="mt-5 flex-grow flex flex-col">
              <ScrollArea className="flex-1">
                <nav className="flex-1 px-2 space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                        'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <item.icon
                        className="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-500"
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}

                  <div className="pt-6 mt-6 border-t border-gray-200">
                    <Link
                      href="/"
                      target="_blank"
                      className={cn(
                        'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                        'text-brand hover:bg-brand-50'
                      )}
                    >
                      <ExternalLink
                        className="mr-3 h-6 w-6 text-brand group-hover:text-brand"
                        aria-hidden="true"
                      />
                      Back to Website
                    </Link>
                  </div>
                </nav>
              </ScrollArea>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <Button
                variant="ghost"
                className="flex items-center text-gray-600 hover:text-gray-900"
                onClick={() => signOut()}
              >
                <LogOut className="mr-3 h-6 w-6" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 pb-20 md:pb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <AdminErrorBoundary>
                {children}
              </AdminErrorBoundary>
            </div>
          </div>
        </main>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
} 