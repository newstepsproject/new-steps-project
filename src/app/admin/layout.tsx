'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Plus,
  UserCircle,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import MobileNav from '@/components/admin/MobileNav';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Shoe Requests', href: '/admin/requests', icon: Users },
  { name: 'Shoe Donations', href: '/admin/shoe-donations', icon: Package },
  { name: 'Money Donations', href: '/admin/money-donations', icon: DollarSign },
  { name: 'Shoe Inventory', href: '/admin/shoes', icon: Package },
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
  const router = useRouter();

  // Handle redirects on client side
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated' && (!session?.user?.role || session.user.role !== 'admin')) {
      console.log('User role:', session?.user?.role);
      router.push('/');
      return;
    }
  }, [status, session, router]);

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

  // Show loading while redirecting
  if (status === 'unauthenticated' || !session?.user?.role || session.user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
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
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Admin Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-900">Admin Panel</h2>
            </div>
            
            {/* Admin User Profile Dropdown */}
            <div className="flex items-center space-x-4">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors p-2 rounded-md hover:bg-gray-50" aria-label="Admin profile">
                    <UserCircle className="h-8 w-8 text-gray-600" />
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-medium">{session?.user?.name || 'Admin'}</p>
                      <p className="text-xs text-gray-500">{session?.user?.email}</p>
                    </div>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-56" align="end">
                  <div className="rounded-md shadow-sm">
                    <div className="py-3 px-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <UserCircle className="h-10 w-10 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{session?.user?.name || 'Admin'}</p>
                          <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                          <div className="flex items-center mt-1">
                            <Shield className="h-3 w-3 text-brand mr-1" />
                            <span className="text-xs text-brand font-medium">
                              {session?.user?.role?.toUpperCase() || 'ADMIN'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <Link 
                        href="/account" 
                        target="_blank"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4 mr-3 text-gray-500" />
                        My Account
                      </Link>
                      <Link 
                        href="/admin/settings" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-3 text-gray-500" />
                        Admin Settings
                      </Link>
                      <Link 
                        href="/" 
                        target="_blank"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-3 text-gray-500" />
                        View Website
                      </Link>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button 
                          onClick={async () => {
                            try {
                              // Clear NextAuth session and force redirect
                              await signOut({ 
                                callbackUrl: '/login?message=admin-logout',
                                redirect: false 
                              });
                              
                              // Clear browser storage and force refresh
                              if (typeof window !== 'undefined') {
                                localStorage.clear();
                                sessionStorage.clear();
                                // Force redirect to clear all caches
                                window.location.href = '/login?message=admin-logout';
                              }
                            } catch (error) {
                              console.error('Logout error:', error);
                              // Fallback - force redirect
                              window.location.href = '/login';
                            }
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3 text-red-500" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <AdminErrorBoundary>
            {children}
          </AdminErrorBoundary>
        </main>

        {/* Mobile Navigation */}
        <MobileNav />
      </div>
    </div>
  );
} 