import { useRouter, usePathname, useSearchParams } from 'next/navigation';

/**
 * Safe router hook that handles router context errors gracefully
 * This prevents the \"Cannot read properties of null (reading 'useContext')\" error
 * that can occur when router context is not properly initialized
 */
export function useSafeRouter() {
  try {
    return useRouter();
  } catch (error) {
    console.warn('Error getting router context:', error);
    
    // Return a fallback router with basic navigation methods
    return {
      push: (href: string) => {
        if (typeof window !== 'undefined') {
          window.location.href = href;
        }
      },
      replace: (href: string) => {
        if (typeof window !== 'undefined') {
          window.location.replace(href);
        }
      },
      back: () => {
        if (typeof window !== 'undefined') {
          window.history.back();
        }
      },
      forward: () => {
        if (typeof window !== 'undefined') {
          window.history.forward();
        }
      },
      refresh: () => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    };
  }
}

/**
 * Safe pathname hook that handles router context errors gracefully
 * This prevents the \"Cannot read properties of null (reading 'useContext')\" error
 * that can occur when router context is not properly initialized
 */
export function useSafePathname() {
  try {
    return usePathname();
  } catch (error) {
    console.warn('Error getting pathname:', error);
    // Return current pathname if available in browser, otherwise empty string
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '';
  }
}

/**
 * Safe search params hook that handles router context errors gracefully
 */
export function useSafeSearchParams() {
  try {
    return useSearchParams();
  } catch (error) {
    console.warn('Error getting search params:', error);
    // Return URLSearchParams from current location if available
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  }
} 