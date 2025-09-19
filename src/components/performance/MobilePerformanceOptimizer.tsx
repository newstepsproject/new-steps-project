'use client';

import { useEffect } from 'react';

interface MobilePerformanceOptimizerProps {
  children: React.ReactNode;
}

export function MobilePerformanceOptimizer({ children }: MobilePerformanceOptimizerProps) {
  useEffect(() => {
    // DEBUG: Check if this is the current version
    console.log('🔧 MobilePerformanceOptimizer: Current version loaded (no font preloading)');
    
    // Mobile-specific performance optimizations
    if (typeof window !== 'undefined') {
      // Check if mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Only run optimizations on mobile
      if (isMobile) {
        // DNS prefetch for external resources (no font preloading)
        const dnsPrefetchDomains = [
          '//fonts.googleapis.com',
          '//fonts.gstatic.com'
        ];
        
        dnsPrefetchDomains.forEach(domain => {
          const link = document.createElement('link');
          link.rel = 'dns-prefetch';
          link.href = domain;
          document.head.appendChild(link);
        });

        // Service Worker registration for mobile caching
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('Service Worker registration failed:', error);
          });
        }

        // Performance monitoring for mobile (simplified)
        if ('performance' in window) {
          // Monitor Core Web Vitals
          const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              // Log performance metrics for mobile optimization
              if (entry.entryType === 'largest-contentful-paint') {
                console.log('LCP:', entry.startTime);
              }
              if (entry.entryType === 'first-input') {
                console.log('FID:', (entry as any).processingStart - entry.startTime);
              }
              if (entry.entryType === 'layout-shift') {
                console.log('CLS:', (entry as any).value);
              }
            });
          });

          try {
            observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
          } catch (e) {
            // Fallback for browsers that don't support all entry types
            console.log('Performance observer not fully supported');
          }
        }
      }
    }
  }, []);

  return <>{children}</>;
}

/**
 * Mobile performance monitoring hook
 */
export function useMobilePerformance() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Track mobile-specific metrics
        const startTime = performance.now();
        
        const trackPageLoad = () => {
          const loadTime = performance.now() - startTime;
          
          // Send to analytics if needed
          console.log('Mobile page load time:', loadTime);
          
          // Track memory usage on mobile
          if ('memory' in performance) {
            const memory = (performance as any).memory;
            console.log('Mobile memory usage:', {
              used: memory.usedJSHeapSize,
              total: memory.totalJSHeapSize,
              limit: memory.jsHeapSizeLimit
            });
          }
        };

        // Track when page is fully loaded
        if (document.readyState === 'complete') {
          trackPageLoad();
        } else {
          window.addEventListener('load', trackPageLoad);
          return () => window.removeEventListener('load', trackPageLoad);
        }
      }
    }
  }, []);
}