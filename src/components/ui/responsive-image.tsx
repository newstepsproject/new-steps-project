'use client';

import React from 'react';
import Image from 'next/image';
import { isMobileDevice } from '@/lib/image-utils';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

/**
 * ResponsiveImage component that automatically serves optimized images
 * for mobile devices and generates responsive srcSet
 */
export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  fill = false,
  style,
  placeholder = 'empty',
  blurDataURL,
  ...props
}: ResponsiveImageProps) {
  // Generate optimized image sources
  const getOptimizedSrc = (originalSrc: string) => {
    // Check if this is a static image that has optimized versions
    const staticImages = [
      '/images/aboutus.png',
      '/images/gpt-hero-image.png',
      '/images/home_photo.png',
      '/images/logo.png',
      '/images/new_logo_no_bg.png'
    ];
    
    const isStaticImage = staticImages.some(img => originalSrc.includes(img.replace('/images/', '')));
    
    if (isStaticImage) {
      // Use optimized version for static images
      const baseName = originalSrc.replace(/\.(png|jpg|jpeg)$/i, '');
      return `${baseName}-optimized.jpg`;
    }
    
    return originalSrc;
  };

  // Generate srcSet for responsive images
  const generateSrcSet = (originalSrc: string) => {
    const staticImages = [
      '/images/aboutus.png',
      '/images/gpt-hero-image.png',
      '/images/home_photo.png',
      '/images/logo.png',
      '/images/new_logo_no_bg.png'
    ];
    
    const isStaticImage = staticImages.some(img => originalSrc.includes(img.replace('/images/', '')));
    
    if (isStaticImage) {
      const baseName = originalSrc.replace(/\.(png|jpg|jpeg)$/i, '').replace('/images/', '');
      const availableSizes = [400, 800, 1200];
      
      // Check which sizes are available for this image
      const srcSetEntries = availableSizes.map(size => {
        return `/images/${baseName}-${size}w.jpg ${size}w`;
      });
      
      return srcSetEntries.join(', ');
    }
    
    return undefined;
  };

  // Generate WebP srcSet for modern browsers
  const generateWebPSrcSet = (originalSrc: string) => {
    const staticImages = [
      '/images/aboutus.png',
      '/images/gpt-hero-image.png',
      '/images/home_photo.png', 
      '/images/logo.png',
      '/images/new_logo_no_bg.png'
    ];
    
    const isStaticImage = staticImages.some(img => originalSrc.includes(img.replace('/images/', '')));
    
    if (isStaticImage) {
      const baseName = originalSrc.replace(/\.(png|jpg|jpeg)$/i, '').replace('/images/', '');
      const availableSizes = [400, 800, 1200];
      
      const webpSrcSetEntries = availableSizes.map(size => {
        return `/images/${baseName}-${size}w.webp ${size}w`;
      });
      
      return webpSrcSetEntries.join(', ');
    }
    
    return undefined;
  };

  const optimizedSrc = getOptimizedSrc(src);
  const srcSet = generateSrcSet(src);
  const webpSrcSet = generateWebPSrcSet(src);

  // For static images with responsive versions, use picture element for better control
  if (srcSet && webpSrcSet) {
    return (
      <picture className={fill ? 'absolute inset-0' : undefined}>
        {/* WebP sources for modern browsers */}
        <source
          srcSet={webpSrcSet}
          sizes={sizes}
          type="image/webp"
        />
        {/* JPEG fallback */}
        <source
          srcSet={srcSet}
          sizes={sizes}
          type="image/jpeg"
        />
        {/* Fallback img element */}
        <Image
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          className={className}
          priority={priority}
          quality={quality}
          sizes={sizes}
          fill={fill}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
          style={style}
          {...props}
        />
      </picture>
    );
  }

  // For regular images, use standard Next.js Image component
  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      quality={quality}
      sizes={sizes}
      fill={fill}
      style={style}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      {...props}
    />
  );
} 