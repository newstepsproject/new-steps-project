import { 
  ImageCategory, 
  ImageStorageType, 
  getImageStorageStrategy, 
  shouldMigrateImage 
} from './image-storage-strategy';
import { uploadImageToS3 } from './s3';
import { compressImage, createCompressedDataURL } from './image-utils';

/**
 * Utility functions for implementing the image storage strategy
 */

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  storageType: ImageStorageType;
  originalSize: number;
  finalSize: number;
  compressionRatio: number;
}

/**
 * Upload an image using the appropriate storage strategy
 */
export async function uploadImageWithStrategy(
  file: File,
  category: ImageCategory,
  metadata?: { 
    shoeId?: number;
    donationId?: string;
    userId?: string;
  }
): Promise<ImageUploadResult> {
  const strategy = getImageStorageStrategy(category);
  const originalSize = file.size;
  
  try {
    // Compress the image according to strategy
    const compressedFile = await compressImage(
      file,
      strategy.compressionSettings.maxWidth,
      strategy.compressionSettings.quality,
      {
        targetFormat: strategy.compressionSettings.format
      }
    );
    
    const finalSize = compressedFile.size;
    const compressionRatio = Math.round((1 - finalSize / originalSize) * 100);
    
    let url: string;
    
    switch (strategy.storageType) {
      case ImageStorageType.S3_CLOUDFRONT:
        // Upload to S3 with CloudFront distribution
        const buffer = Buffer.from(await compressedFile.arrayBuffer());
        const folder = getFolderForCategory(category, metadata);
        const { cloudFrontUrl } = await uploadImageToS3(buffer, compressedFile.type, folder);
        url = cloudFrontUrl;
        break;
        
      case ImageStorageType.DATA_URL:
        // Convert to data URL for database storage
        url = await createCompressedDataURL(compressedFile, true);
        break;
        
      case ImageStorageType.STATIC_ASSETS:
        // Static assets should be handled at build time, not runtime
        throw new Error('Static assets should be uploaded manually to /public/images/');
        
      default:
        throw new Error(`Unsupported storage type: ${strategy.storageType}`);
    }
    
    return {
      success: true,
      url,
      storageType: strategy.storageType,
      originalSize,
      finalSize,
      compressionRatio
    };
    
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      storageType: strategy.storageType,
      originalSize,
      finalSize: 0,
      compressionRatio: 0
    };
  }
}

/**
 * Get the appropriate S3 folder for an image category
 */
function getFolderForCategory(
  category: ImageCategory, 
  metadata?: { shoeId?: number; donationId?: string; userId?: string }
): string {
  switch (category) {
    case ImageCategory.SHOE_INVENTORY:
      return metadata?.shoeId ? `shoes/inventory/${metadata.shoeId}` : 'shoes/inventory';
    case ImageCategory.SHOE_DONATION:
      return metadata?.donationId ? `shoes/donations/${metadata.donationId}` : 'shoes/donations';
    case ImageCategory.USER_PROFILE:
      return metadata?.userId ? `users/profiles/${metadata.userId}` : 'users/profiles';
    case ImageCategory.PROJECT_OFFICERS:
      return 'staff/officers';
    default:
      return 'misc';
  }
}

/**
 * Migrate an image from one storage type to another
 */
export async function migrateImage(
  currentUrl: string,
  fromStorage: ImageStorageType,
  toStorage: ImageStorageType,
  category: ImageCategory,
  metadata?: { shoeId?: number; donationId?: string; userId?: string }
): Promise<ImageUploadResult> {
  try {
    // Download the current image
    let imageData: Buffer;
    
    if (fromStorage === ImageStorageType.DATA_URL) {
      // Convert data URL to buffer
      const base64Data = currentUrl.split(',')[1];
      imageData = Buffer.from(base64Data, 'base64');
    } else {
      // Download from URL
      const response = await fetch(currentUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      imageData = Buffer.from(await response.arrayBuffer());
    }
    
    // Create a File object for processing
    const file = new File([imageData], 'migrated-image.jpg', { type: 'image/jpeg' });
    
    // Upload using the new strategy
    return await uploadImageWithStrategy(file, category, metadata);
    
  } catch (error) {
    console.error('Error migrating image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed',
      storageType: toStorage,
      originalSize: 0,
      finalSize: 0,
      compressionRatio: 0
    };
  }
}

/**
 * Batch process multiple images with progress tracking
 */
export async function batchUploadImages(
  files: File[],
  category: ImageCategory,
  metadata?: { shoeId?: number; donationId?: string; userId?: string },
  onProgress?: (progress: number, currentFile: string) => void
): Promise<ImageUploadResult[]> {
  const results: ImageUploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (onProgress) {
      onProgress((i / files.length) * 100, file.name);
    }
    
    const result = await uploadImageWithStrategy(file, category, metadata);
    results.push(result);
  }
  
  if (onProgress) {
    onProgress(100, 'Complete');
  }
  
  return results;
}

/**
 * Get storage recommendations for existing images
 */
export interface StorageRecommendation {
  currentStorage: ImageStorageType;
  recommendedStorage: ImageStorageType;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  estimatedSavings?: string;
}

export function analyzeImageStorage(
  images: Array<{
    url: string;
    size: number;
    category: ImageCategory;
    accessFrequency: 'low' | 'medium' | 'high';
  }>
): StorageRecommendation[] {
  return images.map(image => {
    const currentStorage = determineCurrentStorageType(image.url);
    const optimalStrategy = getImageStorageStrategy(image.category);
    const shouldMigrate = shouldMigrateImage(
      currentStorage,
      image.category,
      image.size,
      image.accessFrequency
    );
    
    if (!shouldMigrate) {
      return {
        currentStorage,
        recommendedStorage: currentStorage,
        reason: 'Already using optimal storage strategy',
        priority: 'low'
      };
    }
    
    // Determine priority and savings
    let priority: 'low' | 'medium' | 'high' = 'medium';
    let estimatedSavings = '';
    
    if (currentStorage === ImageStorageType.DATA_URL && image.size > 1024 * 1024) {
      priority = 'high';
      estimatedSavings = 'Significant database size reduction and faster page loads';
    } else if (image.accessFrequency === 'high' && currentStorage !== ImageStorageType.S3_CLOUDFRONT) {
      priority = 'high';
      estimatedSavings = 'Faster loading times with CDN distribution';
    }
    
    return {
      currentStorage,
      recommendedStorage: optimalStrategy.storageType,
      reason: getRecommendationReason(currentStorage, optimalStrategy.storageType, image),
      priority,
      estimatedSavings
    };
  });
}

/**
 * Determine the current storage type from a URL
 */
function determineCurrentStorageType(url: string): ImageStorageType {
  if (url.startsWith('data:')) {
    return ImageStorageType.DATA_URL;
  } else if (url.includes('cloudfront.net') || url.includes('s3.')) {
    return ImageStorageType.S3_CLOUDFRONT;
  } else if (url.startsWith('/images/') || url.startsWith('/public/')) {
    return ImageStorageType.STATIC_ASSETS;
  } else {
    // Default assumption for external URLs
    return ImageStorageType.S3_CLOUDFRONT;
  }
}

/**
 * Generate recommendation reason
 */
function getRecommendationReason(
  current: ImageStorageType,
  recommended: ImageStorageType,
  image: { size: number; accessFrequency: string }
): string {
  if (current === ImageStorageType.DATA_URL && recommended === ImageStorageType.S3_CLOUDFRONT) {
    if (image.size > 1024 * 1024) {
      return 'Large data URL is slowing down database queries and page loads';
    } else if (image.accessFrequency === 'high') {
      return 'High-frequency access would benefit from CDN distribution';
    } else {
      return 'S3 + CloudFront provides better performance and scalability';
    }
  }
  
  return 'Recommended storage type provides better performance for this use case';
}

/**
 * Calculate storage costs and performance metrics
 */
export interface StorageMetrics {
  totalImages: number;
  totalSize: number;
  storageBreakdown: Record<ImageStorageType, { count: number; size: number }>;
  estimatedMonthlyCost: number;
  performanceScore: number; // 0-100
}

export function calculateStorageMetrics(
  images: Array<{
    url: string;
    size: number;
    category: ImageCategory;
    accessFrequency: 'low' | 'medium' | 'high';
  }>
): StorageMetrics {
  const breakdown: Record<ImageStorageType, { count: number; size: number }> = {
    [ImageStorageType.S3_CLOUDFRONT]: { count: 0, size: 0 },
    [ImageStorageType.DATA_URL]: { count: 0, size: 0 },
    [ImageStorageType.STATIC_ASSETS]: { count: 0, size: 0 }
  };
  
  let totalSize = 0;
  let performanceScore = 0;
  
  images.forEach(image => {
    const storageType = determineCurrentStorageType(image.url);
    breakdown[storageType].count++;
    breakdown[storageType].size += image.size;
    totalSize += image.size;
    
    // Calculate performance impact
    const frequencyMultiplier = image.accessFrequency === 'high' ? 3 : 
                               image.accessFrequency === 'medium' ? 2 : 1;
    
    if (storageType === ImageStorageType.S3_CLOUDFRONT) {
      performanceScore += 10 * frequencyMultiplier;
    } else if (storageType === ImageStorageType.STATIC_ASSETS) {
      performanceScore += 10 * frequencyMultiplier;
    } else if (storageType === ImageStorageType.DATA_URL) {
      // Penalty for large data URLs
      const sizePenalty = image.size > 500 * 1024 ? 5 : 0;
      performanceScore += Math.max(0, 5 - sizePenalty) * frequencyMultiplier;
    }
  });
  
  // Normalize performance score to 0-100
  const maxPossibleScore = images.length * 10 * 3; // Assuming all high frequency, optimal storage
  performanceScore = Math.round((performanceScore / maxPossibleScore) * 100);
  
  // Estimate monthly costs (rough approximation)
  const s3StorageCost = (breakdown[ImageStorageType.S3_CLOUDFRONT].size / (1024 * 1024 * 1024)) * 0.023; // $0.023 per GB
  const s3TransferCost = (breakdown[ImageStorageType.S3_CLOUDFRONT].count * 0.1) * 0.0001; // Rough transfer estimate
  const estimatedMonthlyCost = s3StorageCost + s3TransferCost;
  
  return {
    totalImages: images.length,
    totalSize,
    storageBreakdown: breakdown,
    estimatedMonthlyCost,
    performanceScore
  };
} 