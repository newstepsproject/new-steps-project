"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { User, Menu, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSafePathname } from "@/hooks/useSafeRouter";
import { SITE_CONFIG } from "@/constants/config";
import Logo from "@/components/ui/logo";
import { CartIcon } from "@/components/cart/CartIcon";
import { useCart } from "@/components/cart/CartProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const Header = () => {
  const { data: session, status, update } = useSession();
  const pathname = useSafePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);
  const { itemCount } = useCart();

  // AGGRESSIVE SESSION POLLING - Force session updates every 2 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      console.log('🔄 FORCE SESSION UPDATE - Current status:', status);
      try {
        await update();
      } catch (error) {
        console.error('Session update error:', error);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [update, status]);

  // Listen for logout events to immediately update UI
  useEffect(() => {
    const handleLogout = () => {
      console.log('🔄 LOGOUT EVENT DETECTED - Immediately hiding user menu');
      setIsLoggedOut(true);
      
      // Force immediate UI refresh
      setForceRefresh(prev => prev + 1);
      
      // Force session revalidation after short delay
      setTimeout(async () => {
        await update();
        window.location.reload();
      }, 1000);
    };
    
    const handleLogin = () => {
      console.log('🔄 LOGIN EVENT DETECTED - Immediately showing user menu');
      setIsLoggedOut(false);
      setForceRefresh(prev => prev + 1);
    };
    
    window.addEventListener('beforeunload', handleLogout);
    window.addEventListener('login-success', handleLogin);
    
    // Listen for storage events (logout in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nextauth.message') {
        handleLogout();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleLogout);
      window.removeEventListener('login-success', handleLogin);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [update]);

  // Reset logout state when session changes + aggressive status checking
  useEffect(() => {
    console.log('🔍 SESSION STATUS CHANGE:', { status, hasSession: !!session, forceRefresh });
    
    if (status === 'unauthenticated') {
      setIsLoggedOut(true);
    } else if (status === 'authenticated' && session) {
      setIsLoggedOut(false);
    }
    
    // Force re-render when status changes
    setForceRefresh(prev => prev + 1);
  }, [status, session]);

  // Navigation links
  const navLinks = [
    { href: '/', label: 'Home', activeOn: ['/'] },
    { href: '/about', label: 'About Us', activeOn: ['/about'] },
    { href: '/donate', label: 'Donate Shoes', activeOn: ['/donate', '/donate/shoes'] },
    { href: '/shoes', label: 'Request Shoes', activeOn: ['/shoes', '/shoes/[id]'] },
    { href: '/get-involved', label: 'Get Involved', activeOn: ['/get-involved'] },
    { href: '/contact', label: 'Contact', activeOn: ['/contact'] },
  ];

  // Check if a nav link is active based on current path
  const isActive = (activeOn: string[]) => {
    return activeOn.some(path => {
      if (path.includes('[')) {
        // Handle dynamic routes
        const basePath = path.split('/')[1];
        return pathname?.startsWith(`/${basePath}`);
      }
      return pathname === path || pathname?.startsWith(path + '/');
    });
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Check if user is admin
  const isAdmin = session?.user?.role === 'admin';

  return (
    <header className="bg-white shadow-soft border-b border-gray-100 sticky top-0 z-30">
      <div className="container mx-auto px-4 py-0">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo width={360} height={100} className="" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                className={`font-medium text-sm transition-colors duration-200 relative group ${
                  isActive(link.activeOn) 
                    ? 'text-gpt-primary' 
                    : 'text-gpt-text hover:text-gpt-primary'
                }`}
              >
                {link.label}
                <span className={`absolute bottom-0 left-0 w-0 h-0.5 bg-gpt-primary transition-all duration-200 
                  ${isActive(link.activeOn) ? 'w-full' : 'group-hover:w-full'}`}>
                </span>
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-5">
            <CartIcon />
            
            {(session && !isLoggedOut) ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-gpt-text hover:text-gpt-primary transition-colors" aria-label="User profile">
                    <User className="h-5 w-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-56">
                  <div className="rounded-md shadow-sm">
                    <div className="py-2 px-3 border-b border-gray-100">
                      <p className="text-sm font-medium">{session.user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        My Account
                      </Link>
                      {isAdmin && (
                        <Link href="/admin" target="_blank" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Shield className="w-4 h-4 mr-2 text-gray-500" />
                          Admin Dashboard
                        </Link>
                      )}
                      <Link href="/api/auth/signout" className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                        Sign out
                      </Link>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Button asChild variant="outline" className="btn-outline text-sm py-1.5 px-4">
                <Link href="/login">Sign In</Link>
              </Button>
            )}
            
            <Button asChild size="sm" className="btn-energy text-sm py-1.5 px-4 shadow-sm">
              <Link href="/donate/shoes">Donate Shoes</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-gpt-text hover:text-gpt-primary transition-colors p-1 rounded-md"
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mt-4 md:hidden bg-white rounded-lg shadow-card border border-gray-100 p-4 animate-fade-in">
            <nav className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 font-medium transition-all duration-200 rounded-md ${
                    isActive(link.activeOn) 
                      ? 'text-gpt-primary bg-gpt-primary/10 shadow-soft' 
                      : 'text-gpt-text hover:text-gpt-primary hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 mt-2 border-t border-gray-100 grid grid-cols-2 gap-3">
                <div
                  className="flex items-center text-gpt-text hover:text-gpt-primary hover:bg-gray-50 p-2 rounded-md transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <CartIcon />
                  <span className="ml-2">Cart</span>
                </div>
                
                {session ? (
                  <>
                    <Link 
                      href="/account" 
                      className="flex items-center text-gray-700 hover:text-brand hover:bg-gray-50 p-2 rounded-md transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User className="h-5 w-5 mr-2" />
                      Profile
                    </Link>
                    {isAdmin && (
                      <Link 
                        href="/admin" 
                        target="_blank"
                        className="flex items-center text-gray-700 hover:text-brand hover:bg-gray-50 p-2 rounded-md transition-colors col-span-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Shield className="h-5 w-5 mr-2" />
                        Admin Dashboard
                      </Link>
                    )}
                  </>
                ) : (
                  <Link 
                    href="/login"
                    className="flex items-center text-gray-700 hover:text-brand hover:bg-gray-50 p-2 rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-5 w-5 mr-2" />
                    Sign In
                  </Link>
                )}
              </div>
              
              <Button
                asChild
                className="btn-energy w-full mt-3"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link href="/donate/shoes">Donate Shoes</Link>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 