'use client';

import { useEffect } from 'react';
import { isMobileDevice } from '@/lib/image-utils';

interface MobilePerformanceOptimizerProps {
  children: React.ReactNode;
}

export function MobilePerformanceOptimizer({ children }: MobilePerformanceOptimizerProps) {
  useEffect(() => {
    // Mobile-specific performance optimizations
    if (typeof window !== 'undefined') {
      const isMobile = isMobileDevice();
      
      // Preload critical resources for mobile
      if (isMobile) {
        // Preload critical fonts
        const criticalFonts = [
          '/fonts/inter-var.woff2',
          '/fonts/montserrat-var.woff2'
        ];
        
        criticalFonts.forEach(font => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.href = font;
          link.as = 'font';
          link.type = 'font/woff2';
          link.crossOrigin = 'anonymous';
          document.head.appendChild(link);
        });

        // DNS prefetch for external resources
        const dnsPrefetchDomains = [
          '//fonts.googleapis.com',
          '//fonts.gstatic.com',
          '//images.unsplash.com'
        ];
        
        dnsPrefetchDomains.forEach(domain => {
          const link = document.createElement('link');
          link.rel = 'dns-prefetch';
          link.href = domain;
          document.head.appendChild(link);
        });

        // Optimize images for mobile viewport
        const images = document.querySelectorAll('img[data-mobile-optimize]');
        images.forEach(img => {
          if (img instanceof HTMLImageElement) {
            // Add loading="lazy" for off-screen images
            if (!img.loading) {
              img.loading = 'lazy';
            }
            
            // Add decoding="async" for better performance
            img.decoding = 'async';
          }
        });

        // Service Worker registration for mobile caching
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('Service Worker registration failed:', error);
          });
        }

        // Connection-aware loading
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        if (connection) {
          // Adjust quality based on connection speed
          const isSlowConnection = connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
          
          if (isSlowConnection) {
            // Add low-bandwidth class for conditional styling
            document.body.classList.add('low-bandwidth');
            
            // Disable auto-playing media
            const videos = document.querySelectorAll('video[autoplay]');
            videos.forEach(video => {
              (video as HTMLVideoElement).autoplay = false;
            });
          }
        }

        // Intersection Observer for lazy loading
        const observerOptions = {
          root: null,
          rootMargin: '50px',
          threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const element = entry.target;
              
              // Lazy load images
              if (element.tagName === 'IMG') {
                const img = element as HTMLImageElement;
                if (img.dataset.src) {
                  img.src = img.dataset.src;
                  img.removeAttribute('data-src');
                }
              }
              
              // Lazy load components
              if (element.classList.contains('lazy-component')) {
                element.classList.add('loaded');
              }
              
              observer.unobserve(element);
            }
          });
        }, observerOptions);

        // Observe all lazy-loadable elements
        const lazyElements = document.querySelectorAll('[data-src], .lazy-component');
        lazyElements.forEach(element => observer.observe(element));

        // Performance monitoring for mobile
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

        // Mobile-specific scroll optimization
        let ticking = false;
        const handleScroll = () => {
          if (!ticking) {
            requestAnimationFrame(() => {
              // Throttled scroll handling for mobile
              ticking = false;
            });
            ticking = true;
          }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        // Cleanup function
        return () => {
          window.removeEventListener('scroll', handleScroll);
          observer?.disconnect();
        };
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
    if (typeof window !== 'undefined' && isMobileDevice()) {
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
  }, []);
}

/**
 * Critical resource preloader for mobile
 */
export function preloadCriticalResources() {
  if (typeof window !== 'undefined' && isMobileDevice()) {
    // Preload critical images
    const criticalImages = [
      '/images/logo-optimized.jpg',
      '/images/home_photo-optimized.jpg'
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = src;
      link.as = 'image';
      document.head.appendChild(link);
    });

    // Preload critical API endpoints
    const criticalEndpoints = [
      '/api/shoes',
      '/api/health'
    ];

    criticalEndpoints.forEach(endpoint => {
      fetch(endpoint, { 
        method: 'HEAD',
        priority: 'high' as any
      }).catch(() => {
        // Ignore errors in preloading
      });
    });
  }
} 