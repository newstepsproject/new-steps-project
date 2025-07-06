/**
 * Image Storage Strategy for New Steps Project
 * 
 * This file defines the comprehensive strategy for image storage across the platform,
 * determining when to use S3 vs data URLs based on use case, performance, and cost considerations.
 */

export enum ImageStorageType {
  S3_CLOUDFRONT = 's3_cloudfront',    // S3 + CloudFront CDN
  DATA_URL = 'data_url',              // Base64 encoded data URLs
  STATIC_ASSETS = 'static_assets'     // Next.js static assets
}

export enum ImageCategory {
  SHOE_INVENTORY = 'shoe_inventory',           // Actual shoe photos in inventory
  SHOE_DONATION = 'shoe_donation',             // Photos from donation submissions
  USER_PROFILE = 'user_profile',               // User profile pictures
  PROJECT_OFFICERS = 'project_officers',       // Staff/officer photos
  STATIC_CONTENT = 'static_content',           // Hero images, logos, etc.
  TEMPORARY_PREVIEW = 'temporary_preview'      // Form previews before submission
}

export interface ImageStorageRule {
  category: ImageCategory;
  storageType: ImageStorageType;
  reasoning: string;
  maxFileSize: number; // in bytes
  compression: boolean;
  cdnCaching: boolean;
}

/**
 * Comprehensive image storage strategy rules
 */
export const IMAGE_STORAGE_RULES: ImageStorageRule[] = [
  {
    category: ImageCategory.SHOE_INVENTORY,
    storageType: ImageStorageType.S3_CLOUDFRONT,
    reasoning: "Permanent inventory images need fast loading, global CDN distribution, and long-term storage. High traffic from public browsing.",
    maxFileSize: 2 * 1024 * 1024, // 2MB
    compression: true,
    cdnCaching: true
  },
  {
    category: ImageCategory.SHOE_DONATION,
    storageType: ImageStorageType.DATA_URL,
    reasoning: "Donation form images are temporary previews before admin processing. Stored in database for admin review, then converted to S3 when approved.",
    maxFileSize: 1 * 1024 * 1024, // 1MB
    compression: true,
    cdnCaching: false
  },
  {
    category: ImageCategory.USER_PROFILE,
    storageType: ImageStorageType.S3_CLOUDFRONT,
    reasoning: "Profile pictures are permanent, need fast loading, and benefit from CDN caching. Moderate traffic.",
    maxFileSize: 1 * 1024 * 1024, // 1MB
    compression: true,
    cdnCaching: true
  },
  {
    category: ImageCategory.PROJECT_OFFICERS,
    storageType: ImageStorageType.S3_CLOUDFRONT,
    reasoning: "Staff photos are permanent, displayed on public pages, need fast loading and CDN distribution.",
    maxFileSize: 1 * 1024 * 1024, // 1MB
    compression: true,
    cdnCaching: true
  },
  {
    category: ImageCategory.STATIC_CONTENT,
    storageType: ImageStorageType.STATIC_ASSETS,
    reasoning: "Hero images, logos, and marketing content are static assets optimized at build time with Next.js image optimization.",
    maxFileSize: 5 * 1024 * 1024, // 5MB
    compression: true,
    cdnCaching: true
  },
  {
    category: ImageCategory.TEMPORARY_PREVIEW,
    storageType: ImageStorageType.DATA_URL,
    reasoning: "Form previews and temporary uploads before submission. No need for permanent storage or CDN.",
    maxFileSize: 500 * 1024, // 500KB
    compression: true,
    cdnCaching: false
  }
];

/**
 * Decision matrix for image storage
 */
export interface ImageStorageDecision {
  storageType: ImageStorageType;
  uploadEndpoint?: string;
  compressionSettings: {
    maxWidth: number;
    quality: number;
    format: string;
  };
  cacheSettings: {
    ttl: number; // seconds
    cdnEnabled: boolean;
  };
}

/**
 * Get storage strategy for a specific image category
 */
export function getImageStorageStrategy(category: ImageCategory): ImageStorageDecision {
  const rule = IMAGE_STORAGE_RULES.find(r => r.category === category);
  
  if (!rule) {
    throw new Error(`No storage rule defined for category: ${category}`);
  }

  const baseDecision: ImageStorageDecision = {
    storageType: rule.storageType,
    compressionSettings: {
      maxWidth: 1200,
      quality: 0.8,
      format: 'image/jpeg'
    },
    cacheSettings: {
      ttl: 3600, // 1 hour default
      cdnEnabled: rule.cdnCaching
    }
  };

  // Customize based on storage type
  switch (rule.storageType) {
    case ImageStorageType.S3_CLOUDFRONT:
      return {
        ...baseDecision,
        uploadEndpoint: '/api/upload',
        compressionSettings: {
          maxWidth: 1200,
          quality: 0.8,
          format: 'image/jpeg'
        },
        cacheSettings: {
          ttl: 86400, // 24 hours for CDN content
          cdnEnabled: true
        }
      };

    case ImageStorageType.DATA_URL:
      return {
        ...baseDecision,
        compressionSettings: {
          maxWidth: 800, // Smaller for data URLs
          quality: 0.7,  // More compression for data URLs
          format: 'image/jpeg'
        },
        cacheSettings: {
          ttl: 0, // No caching for data URLs
          cdnEnabled: false
        }
      };

    case ImageStorageType.STATIC_ASSETS:
      return {
        ...baseDecision,
        compressionSettings: {
          maxWidth: 1920, // Higher quality for static assets
          quality: 0.9,
          format: 'image/webp' // Modern format for static assets
        },
        cacheSettings: {
          ttl: 31536000, // 1 year for static assets
          cdnEnabled: true
        }
      };

    default:
      return baseDecision;
  }
}

/**
 * Migration strategy for existing images
 */
export interface ImageMigrationPlan {
  fromStorage: ImageStorageType;
  toStorage: ImageStorageType;
  batchSize: number;
  estimatedCost: string;
  timeline: string;
}

export const IMAGE_MIGRATION_PLANS: ImageMigrationPlan[] = [
  {
    fromStorage: ImageStorageType.DATA_URL,
    toStorage: ImageStorageType.S3_CLOUDFRONT,
    batchSize: 50,
    estimatedCost: "~$0.10 per 1000 images",
    timeline: "Can be done gradually during admin review process"
  }
];

/**
 * Performance and cost analysis
 */
export const STORAGE_ANALYSIS = {
  dataUrls: {
    pros: [
      "No external dependencies",
      "Immediate availability",
      "No additional API calls",
      "Good for temporary/preview images"
    ],
    cons: [
      "Increases database size significantly",
      "No CDN caching benefits",
      "Slower page loads for image-heavy pages",
      "Base64 encoding adds ~33% size overhead"
    ],
    costPerImage: "$0 (stored in database)",
    performanceImpact: "High for multiple images"
  },
  s3CloudFront: {
    pros: [
      "Fast global CDN delivery",
      "Optimized for web delivery",
      "Separate from database storage",
      "Scalable and cost-effective",
      "Professional image delivery"
    ],
    cons: [
      "Requires AWS setup and management",
      "Additional API calls for uploads",
      "Dependency on external service"
    ],
    costPerImage: "~$0.0001 storage + $0.0001 transfer",
    performanceImpact: "Low - optimized delivery"
  },
  staticAssets: {
    pros: [
      "Next.js optimization at build time",
      "Perfect for unchanging content",
      "Zero runtime cost",
      "Automatic responsive image generation"
    ],
    cons: [
      "Only suitable for static content",
      "Requires rebuild for changes",
      "Not suitable for user-generated content"
    ],
    costPerImage: "$0 (part of application bundle)",
    performanceImpact: "Minimal - pre-optimized"
  }
};

/**
 * Implementation guidelines
 */
export const IMPLEMENTATION_GUIDELINES = {
  immediate: [
    "Use data URLs for donation form previews",
    "Continue using S3 for inventory shoe images",
    "Use static assets for hero images and logos"
  ],
  shortTerm: [
    "Implement automatic migration from data URLs to S3 when donations are approved",
    "Add compression for all data URL uploads",
    "Optimize existing static assets"
  ],
  longTerm: [
    "Consider implementing progressive image loading",
    "Add WebP format support for modern browsers",
    "Implement automatic image optimization pipeline"
  ]
};

/**
 * Helper function to determine if an image should be migrated
 */
export function shouldMigrateImage(
  currentStorage: ImageStorageType,
  category: ImageCategory,
  imageSize: number,
  accessFrequency: 'low' | 'medium' | 'high'
): boolean {
  const optimalStrategy = getImageStorageStrategy(category);
  
  // Don't migrate if already using optimal storage
  if (currentStorage === optimalStrategy.storageType) {
    return false;
  }
  
  // Migrate data URLs to S3 for high-frequency access
  if (currentStorage === ImageStorageType.DATA_URL && 
      optimalStrategy.storageType === ImageStorageType.S3_CLOUDFRONT &&
      accessFrequency === 'high') {
    return true;
  }
  
  // Migrate large data URLs regardless of access frequency
  if (currentStorage === ImageStorageType.DATA_URL && imageSize > 500 * 1024) {
    return true;
  }
  
  return false;
} 