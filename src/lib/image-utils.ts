import { v4 as uuid } from 'uuid';
import { UPLOAD_LIMITS } from '@/constants/config';

/**
 * Mobile-optimized compression settings
 * These settings are optimized for mobile uploads where admins take photos
 */
export const MOBILE_COMPRESSION_SETTINGS = {
  // Smaller max width for mobile uploads (reduces file size significantly)
  maxWidth: 1200,
  // More aggressive compression for mobile (smaller files)
  quality: 0.7,
  // Maximum file size after compression (2MB for mobile)
  maxFileSize: 2 * 1024 * 1024,
  // Force compression for files larger than 500KB
  forceCompressionThreshold: 500 * 1024,
  // Additional mobile optimizations
  progressive: true, // Enable progressive JPEG for faster loading
  removeMetadata: true, // Strip EXIF data to reduce file size
  targetFormat: 'image/jpeg', // Convert to JPEG for better compression
};

/**
 * Desktop compression settings for comparison
 */
export const DESKTOP_COMPRESSION_SETTINGS = {
  maxWidth: 1920,
  quality: 0.8,
  maxFileSize: 5 * 1024 * 1024,
  forceCompressionThreshold: 1024 * 1024, // 1MB threshold
  progressive: false,
  removeMetadata: false,
  targetFormat: null, // Keep original format
};

/**
 * Validates an image file based on size and type
 * @param file The file to validate
 * @returns An object containing validation result and error message if any
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > UPLOAD_LIMITS.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${formatFileSize(UPLOAD_LIMITS.maxFileSize)}`
    };
  }

  // Check file type
  if (!UPLOAD_LIMITS.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types are: ${UPLOAD_LIMITS.allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Formats a file size in bytes to a human-readable format
 * @param bytes File size in bytes
 * @returns Formatted file size (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Creates a placeholder image URL for testing
 * @param text Text to display in the placeholder
 * @param color Background color
 * @returns A placeholder image URL
 */
export function createPlaceholderImage(text: string = 'Test Image', color: string = '0057A0'): string {
  return `https://via.placeholder.com/800x600/${color}/FFFFFF.png?text=${encodeURIComponent(text)}`;
}

/**
 * Extracts file extension from filename
 * @param fileName The full file name
 * @returns The file extension (e.g., "jpg", "png")
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || 'jpg';
}

/**
 * Generates a unique file name for uploaded images
 * @param originalName Original file name
 * @param prefix Prefix to add to the file name
 * @returns A unique file name
 */
export function generateUniqueFileName(originalName: string, prefix: string = 'shoe'): string {
  const extension = getFileExtension(originalName);
  const timestamp = Date.now();
  const randomId = uuid().substring(0, 8);
  
  return `${prefix}_${timestamp}_${randomId}.${extension}`;
}

/**
 * Reads a file and returns its data URL
 * @param file The file to read
 * @returns A promise that resolves with the data URL
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an image file to reduce size with advanced mobile optimizations
 * @param file The image file to compress
 * @param maxWidth Maximum width for the compressed image
 * @param quality JPEG quality (0-1)
 * @param options Additional compression options
 * @returns A promise that resolves with the compressed file
 */
export async function compressImage(
  file: File,
  maxWidth: number = UPLOAD_LIMITS.maxWidth,
  quality: number = UPLOAD_LIMITS.compressionQuality,
  options: {
    progressive?: boolean;
    removeMetadata?: boolean;
    targetFormat?: string | null;
  } = {}
): Promise<File> {
  // Skip compression for non-supported image types or if compression is not needed
  if (!file.type.startsWith('image/') || file.size < UPLOAD_LIMITS.maxFileSize / 2) {
    return file;
  }

  try {
    // Read the file as a data URL
    const dataUrl = await readFileAsDataURL(file);
    
    // Create an image element
    const img = document.createElement('img');
    
    // Wait for the image to load
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = dataUrl;
    });
    
    // Calculate new dimensions while maintaining aspect ratio
    let width = img.width;
    let height = img.height;
    
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    // Draw the image on the canvas with better quality settings
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Enable better image smoothing for mobile
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(img, 0, 0, width, height);
    
    // Determine output format (convert to JPEG for mobile optimization)
    const outputFormat = options.targetFormat || file.type;
    const useJPEG = outputFormat === 'image/jpeg' || options.targetFormat === 'image/jpeg';
    
    // Convert the canvas to a blob with optimized settings
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        useJPEG ? 'image/jpeg' : file.type,
        quality
      );
    });
    
    // Create a new file from the blob
    const compressedFile = new File([blob], file.name, {
      type: useJPEG ? 'image/jpeg' : file.type,
      lastModified: file.lastModified
    });
    
    console.log(`Image compressed: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)} (${Math.round((1 - compressedFile.size / file.size) * 100)}% reduction)`);
    
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    // Fall back to the original file if compression fails
    return file;
  }
}

/**
 * Mobile-optimized image compression for admin uploads
 * Uses aggressive compression settings suitable for mobile phone uploads
 * @param file The image file to compress
 * @returns A promise that resolves with the compressed file
 */
export async function compressImageForMobile(file: File): Promise<File> {
  // Always compress for mobile uploads if file is larger than threshold
  if (!file.type.startsWith('image/') || file.size < MOBILE_COMPRESSION_SETTINGS.forceCompressionThreshold) {
    return file;
  }

  return compressImage(
    file,
    MOBILE_COMPRESSION_SETTINGS.maxWidth,
    MOBILE_COMPRESSION_SETTINGS.quality,
    {
      progressive: MOBILE_COMPRESSION_SETTINGS.progressive,
      removeMetadata: MOBILE_COMPRESSION_SETTINGS.removeMetadata,
      targetFormat: MOBILE_COMPRESSION_SETTINGS.targetFormat,
    }
  );
}

/**
 * Processes an image file for upload with mobile optimization
 * Validates, compresses, and prepares the file for upload
 * @param file The image file to process
 * @param isMobileUpload Whether this is a mobile upload (uses aggressive compression)
 * @returns A promise that resolves with the processed file and validation result
 */
export async function processImageForUpload(
  file: File,
  isMobileUpload: boolean = false
): Promise<{ file: File; valid: boolean; error?: string; originalSize: number; compressedSize: number }> {
  const originalSize = file.size;
  
  // Validate the file first
  const validation = validateImageFile(file);
  if (!validation.valid) {
    return {
      file,
      valid: false,
      error: validation.error,
      originalSize,
      compressedSize: originalSize
    };
  }

  try {
    // Compress the image
    const compressedFile = isMobileUpload 
      ? await compressImageForMobile(file)
      : await compressImage(file);

    return {
      file: compressedFile,
      valid: true,
      originalSize,
      compressedSize: compressedFile.size
    };
  } catch (error) {
    console.error('Error processing image:', error);
    return {
      file,
      valid: false,
      error: 'Failed to process image',
      originalSize,
      compressedSize: originalSize
    };
  }
}

/**
 * Creates a data URL from a file with compression
 * Useful for preview purposes while maintaining smaller file sizes
 * @param file The image file
 * @param isMobileUpload Whether to use mobile compression
 * @returns A promise that resolves with the data URL
 */
export async function createCompressedDataURL(
  file: File,
  isMobileUpload: boolean = false
): Promise<string> {
  const processed = await processImageForUpload(file, isMobileUpload);
  return readFileAsDataURL(processed.file);
}

/**
 * Generates responsive image srcSet for different screen sizes
 * @param baseUrl The base image URL
 * @param sizes Array of widths to generate
 * @returns srcSet string for responsive images
 */
export function generateResponsiveSrcSet(baseUrl: string, sizes: number[] = [400, 800, 1200, 1600]): string {
  return sizes.map(size => `${baseUrl}?w=${size} ${size}w`).join(', ');
}

/**
 * Gets optimal image dimensions for mobile devices
 * @param originalWidth Original image width
 * @param originalHeight Original image height
 * @param maxWidth Maximum width for mobile
 * @returns Optimized dimensions
 */
export function getMobileOptimizedDimensions(
  originalWidth: number, 
  originalHeight: number, 
  maxWidth: number = 800
): { width: number; height: number } {
  if (originalWidth <= maxWidth) {
    return { width: originalWidth, height: originalHeight };
  }
  
  const aspectRatio = originalHeight / originalWidth;
  return {
    width: maxWidth,
    height: Math.round(maxWidth * aspectRatio)
  };
}

/**
 * Detects if the user is on a mobile device
 * @returns boolean indicating if the device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
}

/**
 * Gets optimal image quality based on device and connection
 * @returns Quality value between 0.4 and 0.9
 */
export function getOptimalImageQuality(): number {
  if (typeof window === 'undefined') return 0.8;
  
  const isMobile = isMobileDevice();
  
  // Check for slow connection
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g');
  
  if (isSlowConnection) {
    return 0.4; // Very aggressive compression for slow connections
  } else if (isMobile) {
    return 0.6; // Aggressive compression for mobile
  } else {
    return 0.8; // Standard compression for desktop
  }
}

/**
 * Batch processes multiple images for upload with progress tracking
 * @param files Array of files to process
 * @param isMobileUpload Whether to use mobile compression
 * @param onProgress Callback for progress updates
 * @returns Promise resolving to array of processed files with metadata
 */
export async function batchProcessImages(
  files: File[],
  isMobileUpload: boolean = false,
  onProgress?: (progress: number, currentFile: string) => void
): Promise<Array<{
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  valid: boolean;
  error?: string;
}>> {
  const results = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Update progress
    if (onProgress) {
      onProgress((i / files.length) * 100, file.name);
    }
    
    try {
      const processed = await processImageForUpload(file, isMobileUpload);
      const compressionRatio = Math.round((1 - processed.compressedSize / processed.originalSize) * 100);
      
      results.push({
        file: processed.file,
        originalSize: processed.originalSize,
        compressedSize: processed.compressedSize,
        compressionRatio,
        valid: processed.valid,
        error: processed.error
      });
    } catch (error) {
      results.push({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
        valid: false,
        error: error instanceof Error ? error.message : 'Processing failed'
      });
    }
  }
  
  // Final progress update
  if (onProgress) {
    onProgress(100, 'Complete');
  }
  
  return results;
} 

