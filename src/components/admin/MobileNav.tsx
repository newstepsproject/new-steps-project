'use client';

import { Home, Package, Users, Plus, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const mobileNavItems = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Inventory', href: '/admin/shoes', icon: Package },
  { name: 'Requests', href: '/admin/requests', icon: Users },
  { name: 'Add Shoe', href: '/admin/shoes/add', icon: Plus, primary: true },
];

const allNavItems = [
  { name: 'Dashboard', href: '/admin', icon: Home },
  { name: 'Shoe Donations', href: '/admin/shoe-donations', icon: Package },
  { name: 'Money Donations', href: '/admin/money-donations', icon: Package },
  { name: 'Shoe Inventory', href: '/admin/shoes', icon: Package },
  { name: 'Shoe Requests', href: '/admin/requests', icon: Users },
  { name: 'Users', href: '/admin/users', icon: Users },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

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
            <SheetContent side="bottom" className="h-[50vh]">
              <div className="py-4">
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