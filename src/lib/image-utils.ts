import { v4 as uuid } from 'uuid';
import { UPLOAD_LIMITS } from '@/constants/config';

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
  return fileName.split('.').pop()?.toLowerCase() || '';
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
 * Compresses an image file to reduce size
 * @param file The image file to compress
 * @param maxWidth Maximum width for the compressed image
 * @param quality JPEG quality (0-1)
 * @returns A promise that resolves with the compressed file
 */
export async function compressImage(
  file: File,
  maxWidth: number = UPLOAD_LIMITS.maxWidth,
  quality: number = UPLOAD_LIMITS.compressionQuality
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
    
    // Draw the image on the canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    ctx.drawImage(img, 0, 0, width, height);
    
    // Convert the canvas to a blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        },
        file.type,
        quality
      );
    });
    
    // Create a new file from the blob
    return new File([blob], file.name, {
      type: file.type,
      lastModified: file.lastModified
    });
  } catch (error) {
    console.error('Image compression failed:', error);
    // Fall back to the original file if compression fails
    return file;
  }
} 

