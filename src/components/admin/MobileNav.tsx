'use client';

import { Home, Package, Users, Plus, Menu, User, Settings, ExternalLink, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useSafePathname } from '@/hooks/useSafeRouter';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from 'next-auth/react';

// Using centralized safe pathname hook from @/hooks/useSafeRouter

const mobileNavItems = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Inventory', href: '/admin/shoes', icon: Package },
  { name: 'Requests', href: '/admin/requests', icon: Users },
  { name: 'Add Shoe', href: '/admin/shoes/add', icon: Plus, primary: true },
];

const allNavItems = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Shoe Requests', href: '/admin/requests', icon: Users },
  { name: 'Shoe Donations', href: '/admin/shoe-donations', icon: Package },
  { name: 'Money Donations', href: '/admin/money-donations', icon: Package },
  { name: 'Shoe Inventory', href: '/admin/shoes', icon: Package },
  { name: 'Users', href: '/admin/users', icon: Users },
];

export default function MobileNav() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: session } = useSession();
  const [isClient, setIsClient] = useState(false);
  
  // Use safe pathname hook
  const pathname = useSafePathname();

  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return null;
  }

  return (
    <>
      {/* Bottom Navigation - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-50">
        <nav className="flex justify-around items-center h-16">
          {mobileNavItems.map((item) => {
            const isActive = pathname === item.href;
            
            if (item.primary) {
              return (
                <Link key={item.name} href={item.href}>
                  <div className="flex flex-col items-center justify-center p-2">
                    <div className="bg-brand text-white rounded-full p-3">
                      <item.icon className="h-5 w-5" />
                    </div>
                  </div>
                </Link>
              );
            }
            
            return (
              <Link key={item.name} href={item.href}>
                <div className="flex flex-col items-center justify-center p-2">
                  <item.icon 
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-brand" : "text-gray-500"
                    )}
                  />
                  <span className={cn(
                    "text-xs mt-1",
                    isActive ? "text-brand font-medium" : "text-gray-500"
                  )}>
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
          
          {/* More Menu */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center p-2">
                <Menu className="h-5 w-5 text-gray-500" />
                <span className="text-xs mt-1 text-gray-500">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[60vh]">
              <div className="py-4">
                {/* Admin Profile Section */}
                {session?.user && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-brand" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{session.user.name || 'Admin'}</p>
                        <p className="text-xs text-gray-500">{session.user.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/account"
                        target="_blank"
                        onClick={() => setSheetOpen(false)}
                        className="flex items-center justify-center px-3 py-2 bg-white rounded-md text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Account
                      </Link>
                      <Link
                        href="/admin/settings"
                        onClick={() => setSheetOpen(false)}
                        className="flex items-center justify-center px-3 py-2 bg-white rounded-md text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                      <Link
                        href="/"
                        target="_blank"
                        onClick={() => setSheetOpen(false)}
                        className="flex items-center justify-center px-3 py-2 bg-white rounded-md text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Website
                      </Link>
                      <button
                        onClick={() => {
                          setSheetOpen(false);
                          signOut({ callbackUrl: '/' });
                        }}
                        className="flex items-center justify-center px-3 py-2 bg-white rounded-md text-sm text-red-600 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
                
                <h3 className="font-semibold mb-4">All Admin Pages</h3>
                <nav className="space-y-2">
                  {allNavItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSheetOpen(false)}
                      className={cn(
                        "flex items-center px-4 py-3 rounded-lg",
                        pathname === item.href 
                          ? "bg-brand/10 text-brand" 
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
      
      {/* Add padding to body content on mobile to account for bottom nav */}
      <div className="h-16 md:hidden" />
    </>
  );
} 