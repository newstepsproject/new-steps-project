import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import { Button } from './button';

interface ImageGalleryProps {
  images: string[];
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape';
  alt?: string;
}

export function ImageGallery({
  images,
  className,
  aspectRatio = 'square',
  alt = 'Shoe image'
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className={cn(
        'relative bg-gray-100 rounded-md overflow-hidden',
        aspectRatio === 'square' && 'aspect-square',
        aspectRatio === 'video' && 'aspect-video',
        aspectRatio === 'portrait' && 'aspect-[3/4]',
        aspectRatio === 'landscape' && 'aspect-[4/3]',
        className
      )}>
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          No images available
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className={cn(
        'relative rounded-md overflow-hidden bg-gray-100',
        aspectRatio === 'square' && 'aspect-square',
        aspectRatio === 'video' && 'aspect-video',
        aspectRatio === 'portrait' && 'aspect-[3/4]',
        aspectRatio === 'landscape' && 'aspect-[4/3]',
        className
      )}>
        <Image
          src={images[currentIndex]}
          alt={`${alt} ${currentIndex + 1}`}
          fill
          className="object-cover hover:scale-105 transition-transform cursor-pointer"
          onClick={openModal}
        />
        
        {images.length > 1 && (
          <>
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow-md hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow-md hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
        
        <button
          className="absolute right-2 bottom-2 bg-white/80 rounded-full p-1 shadow-md hover:bg-white"
          onClick={(e) => {
            e.stopPropagation();
            openModal();
          }}
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  idx === currentIndex ? "bg-white" : "bg-white/50"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex mt-2 overflow-x-auto gap-2 pb-1">
          {images.map((image, idx) => (
            <div
              key={idx}
              className={cn(
                "relative w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2",
                idx === currentIndex ? "border-primary" : "border-transparent"
              )}
              onClick={() => setCurrentIndex(idx)}
            >
              <Image
                src={image}
                fill
                className="object-cover"
                alt={`${alt} thumbnail ${idx + 1}`}
                sizes="64px"
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Full-size modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 z-10 bg-black/20 text-white hover:bg-black/40 m-2"
              onClick={closeModal}
            >
              <X className="h-6 w-6" />
            </Button>
            
            <div className="relative bg-black rounded-lg overflow-hidden h-[80vh]">
              <Image
                src={images[currentIndex]}
                alt={`${alt} full size ${currentIndex + 1}`}
                fill
                className="object-contain"
              />
              
              {images.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 rounded-full p-3 hover:bg-black/60"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-6 w-6 text-white" />
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 rounded-full p-3 hover:bg-black/60"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-6 w-6 text-white" />
                  </button>
                </>
              )}
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-2 w-2 rounded-full",
                      idx === currentIndex ? "bg-white" : "bg-white/50"
                    )}
                    onClick={() => setCurrentIndex(idx)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 