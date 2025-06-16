'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Footprints, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCart } from '@/components/cart/CartProvider';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { itemCount } = useCart();

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/shoes', icon: ShoppingBag, label: 'Shoes' },
    { href: '/cart', icon: ShoppingCart, label: 'Cart', badge: itemCount },
    { href: '/donate', icon: Footprints, label: 'Donate' },
    { href: session ? '/account' : '/login', icon: User, label: session ? 'Account' : 'Login' },
  ];

  // Don't show on admin pages
  if (pathname?.startsWith('/admin')) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname?.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center relative transition-colors ${
                isActive 
                  ? 'text-brand' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-energy text-white text-xs font-medium rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">{item.label}</span>
              {isActive && (
                <span className="absolute top-0 left-0 right-0 h-0.5 bg-brand" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
} 