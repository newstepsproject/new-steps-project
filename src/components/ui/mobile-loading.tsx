'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MobileLoadingProps {
  className?: string;
  type?: 'spinner' | 'skeleton' | 'dots' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function MobileLoading({ 
  className, 
  type = 'spinner', 
  size = 'md', 
  text 
}: MobileLoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  if (type === 'spinner') {
    return (
      <div className={cn("flex flex-col items-center justify-center", className)}>
        <div className={cn(
          "border-2 border-gray-200 border-t-brand rounded-full animate-spin",
          sizeClasses[size]
        )} />
        {text && <p className="mt-2 text-sm text-gray-600">{text}</p>}
      </div>
    );
  }

  if (type === 'dots') {
    return (
      <div className={cn("flex items-center justify-center space-x-1", className)}>
        <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-brand rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
      </div>
    );
  }

  if (type === 'pulse') {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className={cn(
          "bg-brand rounded-full animate-pulse",
          sizeClasses[size]
        )} />
        {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
      </div>
    );
  }

  // Skeleton loader
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  );
}

// Skeleton components for different content types
export function ShoeCardSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-lg shadow-sm border p-4">
      <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="flex space-x-2 mt-2">
          <div className="h-6 bg-gray-200 rounded w-12" />
          <div className="h-6 bg-gray-200 rounded w-16" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded w-full" />
        </td>
      ))}
    </tr>
  );
}

export function FormSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-32" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-28" />
        <div className="h-24 bg-gray-200 rounded" />
      </div>
      <div className="h-10 bg-gray-200 rounded w-32" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-96" />
      </div>
      
      {/* Content skeleton */}
      <div className="grid gap-6">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
        
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-48" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Progressive loading wrapper
interface ProgressiveLoadingProps {
  isLoading: boolean;
  skeleton?: React.ReactNode;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProgressiveLoading({ 
  isLoading, 
  skeleton, 
  children, 
  fallback 
}: ProgressiveLoadingProps) {
  if (isLoading) {
    return skeleton || fallback || <MobileLoading type="skeleton" />;
  }
  
  return <>{children}</>;
}

// Mobile-optimized lazy loading wrapper
interface LazyLoadProps {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

export function LazyLoad({ 
  children, 
  placeholder, 
  threshold = 0.1, 
  rootMargin = '50px' 
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return (
    <div ref={ref}>
      {isVisible ? children : (placeholder || <MobileLoading type="skeleton" />)}
    </div>
  );
}

// Performance monitoring component
export function PerformanceMonitor({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor loading performance
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            console.log('Page Load Time:', navEntry.loadEventEnd - navEntry.navigationStart);
          }
          
          if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint'] });
      } catch (e) {
        console.log('Performance observer not supported');
      }

      return () => observer.disconnect();
    }
  }, []);

  return <>{children}</>;
} 