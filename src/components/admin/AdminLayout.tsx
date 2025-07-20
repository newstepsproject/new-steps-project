'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useSafePathname } from '@/hooks/useSafeRouter';
import { Home, Package, Users, DollarSign, FileText, Settings, LogOut, Footprints } from 'lucide-react';
import MobileNav from './MobileNav';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = useSafePathname();
  
  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: <Home className="mr-2 h-4 w-4" /> },
    { label: 'Shoes', href: '/admin/shoes', icon: <Package className="mr-2 h-4 w-4" /> },
    { label: 'Users', href: '/admin/users', icon: <Users className="mr-2 h-4 w-4" /> },
    { label: 'Donations', href: '/admin/shoe-donations', icon: <FileText className="mr-2 h-4 w-4" /> },
    { label: 'Money Donations', href: '/admin/money-donations', icon: <DollarSign className="mr-2 h-4 w-4" /> },
    { label: 'Settings', href: '/admin/settings', icon: <Settings className="mr-2 h-4 w-4" /> },
  ];

  const handleLogout = async () => {
    try {
      console.log('🔄 LOGOUT ATTEMPT - Environment:', process.env.NODE_ENV);
      console.log('🔄 LOGOUT ATTEMPT - Domain:', window.location.hostname);
      
      // IMMEDIATE UI FEEDBACK - Hide admin interface immediately
      const event = new Event('admin-logout');
      window.dispatchEvent(event);
      
      // Import signOut dynamically
      const { signOut } = await import('next-auth/react');
      
      console.log('🚀 STARTING LOGOUT PROCESS...');
      const result = await signOut({
        callbackUrl: '/login?message=admin-logout',
        redirect: false  // Prevent automatic redirect to have more control
      });
      
      console.log('✅ SIGNOUT RESULT:', result);
      
      // AGGRESSIVE SESSION CLEARING
      // Clear all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Clear session storage
      sessionStorage.clear();
      localStorage.removeItem('nextauth.message');
      
      console.log('🍪 CHECKING COOKIES AFTER LOGOUT:', document.cookie);
      
      // IMMEDIATE REDIRECT - Don't wait for NextAuth
      console.log('🔄 FORCING IMMEDIATE REDIRECT...');
      window.location.href = '/login?message=admin-logout';
      
    } catch (error) {
      console.error('❌ LOGOUT ERROR:', error);
      // Force redirect even on error
      window.location.href = '/login?message=admin-logout';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <Footprints className="h-8 w-8 text-white" />
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${
                    pathname === item.href || pathname?.startsWith(`${item.href}/`)
                      ? 'bg-slate-800 text-white'
                      : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:bg-slate-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </button>
            </nav>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="md:pl-64">
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
      </div>
      
      {/* Mobile bottom navigation */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  );
} 