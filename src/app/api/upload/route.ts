import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Upload configuration
const UPLOAD_LIMITS = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 5,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
};

/**
 * API endpoint for image uploads
 * Env-toggle: local filesystem (default) or S3+CloudFront when STORAGE_PROVIDER=s3
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'shoes'; // Changed from 'general' to 'shoes'

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > UPLOAD_LIMITS.maxFileSize) {
      const maxMB = UPLOAD_LIMITS.maxFileSize / (1024 * 1024);
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxMB}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    if (!UPLOAD_LIMITS.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${UPLOAD_LIMITS.allowedTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate unique filename with environment prefix to prevent dev/prod collisions
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const environment = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
    const randomString = Math.random().toString(36).substring(7);
    const filename = `${environment}-${folder}-${timestamp}-${randomString}.${extension}`;
    
    // Convert file to buffer once
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const storageProvider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

    if (storageProvider === 's3') {
      // Upload to S3
      const region = process.env.S3_REGION || '';
      const bucket = process.env.S3_BUCKET || '';
      const prefix = process.env.S3_PREFIX || '';
      const publicBase = process.env.S3_PUBLIC_URL || '';

      if (!region || !bucket) {
        console.warn('S3 configuration missing, falling back to local storage');
      } else {
        const key = [prefix, folder, filename].filter(Boolean).join('/');
        const s3 = new S3Client({ region });
        const putCmd = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: file.type,
          ACL: 'public-read'
        });
        await s3.send(putCmd);

        // Prefer CloudFront/public URL if provided
        const url = publicBase
          ? `${publicBase.replace(/\/$/, '')}/${[folder, filename].join('/')}`
          : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

        return NextResponse.json({
          success: true,
          url,
          filename,
          size: file.size,
          type: file.type,
          message: 'Image uploaded successfully to S3',
          provider: 's3'
        });
      }
    }

    // Default: local storage
    const uploadDir = join(process.cwd(), 'public', 'images', folder);
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    const publicUrl = `/images/${folder}/${filename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename,
      size: file.size,
      type: file.type,
      message: 'Image uploaded successfully to local storage',
      provider: 'local'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to return upload configuration
 */
export async function GET() {
  const storageProvider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
  const isS3 = storageProvider === 's3';
  
  return NextResponse.json({
    limits: {
      maxFileSize: UPLOAD_LIMITS.maxFileSize,
      maxFileSizeMB: UPLOAD_LIMITS.maxFileSize / (1024 * 1024),
      allowedFileTypes: UPLOAD_LIMITS.allowedTypes,
      maxFiles: UPLOAD_LIMITS.maxFiles,
    },
    storage: isS3 ? 'Amazon S3 + CloudFront' : 'Local File System',
    provider: storageProvider,
    bucket: isS3 ? process.env.S3_BUCKET : null,
    region: isS3 ? process.env.S3_REGION : null,
    publicUrl: isS3 ? process.env.S3_PUBLIC_URL : null,
    directory: isS3 ? 'S3 bucket with CloudFront CDN' : 'public/images/[folder]/',
    note: isS3 ? 'Using S3 storage with CloudFront CDN for optimal performance' : 'Using local file system storage'
  });
} 