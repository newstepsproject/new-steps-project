import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadImageToS3 } from '@/lib/s3';
import { UPLOAD_LIMITS } from '@/constants/config';

/**
 * API endpoint for image uploads to S3
 * Accepts multipart form data with files
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to upload images' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'shoes';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > UPLOAD_LIMITS.maxFileSize) {
      return NextResponse.json(
        { error: `File size exceeds the ${UPLOAD_LIMITS.maxFileSize / (1024 * 1024)}MB limit` },
        { status: 400 }
      );
    }

    // Check file type
    if (!UPLOAD_LIMITS.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Supported formats: JPG, PNG, WebP' },
        { status: 400 }
      );
    }

    // Convert the file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3
    const { s3Url, cloudFrontUrl } = await uploadImageToS3(
      buffer,
      file.type,
      folder
    );

    console.log('Image uploaded successfully to S3:', cloudFrontUrl);

    // Return the URLs
    return NextResponse.json({
      success: true,
      url: cloudFrontUrl, // Use CloudFront URL for best performance
      s3Url: s3Url,
      cloudFrontUrl: cloudFrontUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
      message: 'Image uploaded successfully to S3',
      // Include upload limits info for debugging
      limits: {
        maxFileSize: UPLOAD_LIMITS.maxFileSize,
        maxFileSizeMB: UPLOAD_LIMITS.maxFileSize / (1024 * 1024),
        allowedFileTypes: UPLOAD_LIMITS.allowedTypes,
        maxFiles: UPLOAD_LIMITS.maxFiles,
      }
    });

  } catch (error) {
    console.error('S3 upload error:', error);
    
    // LOCAL STORAGE FALLBACK - when S3 fails, save locally
    try {
      console.log('S3 failed, attempting local storage fallback...');
      
      const fs = require('fs');
      const path = require('path');
      const { v4: uuidv4 } = require('uuid');
      
      // Generate unique filename
      const fileExtension = file.type.split('/')[1] || 'jpeg';
      const fileName = `${uuidv4()}.${fileExtension}`;
      const localPath = path.join(process.cwd(), 'public', 'images', folder, fileName);
      
      // Ensure directory exists
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write file to local storage
      fs.writeFileSync(localPath, buffer);
      
      // Return local URL
      const localUrl = `/images/${folder}/${fileName}`;
      
      console.log('Image saved locally:', localUrl);
      
      return NextResponse.json({
        success: true,
        url: localUrl,
        filename: file.name,
        size: file.size,
        type: file.type,
        message: 'Image uploaded successfully to local storage (S3 unavailable)',
        storage: 'local',
        limits: {
          maxFileSize: UPLOAD_LIMITS.maxFileSize,
          maxFileSizeMB: UPLOAD_LIMITS.maxFileSize / (1024 * 1024),
          allowedFileTypes: UPLOAD_LIMITS.allowedTypes,
          maxFiles: UPLOAD_LIMITS.maxFiles,
        }
      });
      
    } catch (localError) {
      console.error('Local storage fallback also failed:', localError);
      return NextResponse.json(
        { 
          error: 'Failed to upload image to both S3 and local storage',
          s3Error: error instanceof Error ? error.message : String(error),
          localError: localError instanceof Error ? localError.message : String(localError)
        },
        { status: 500 }
      );
    }
  }
}

// GET endpoint to return upload configuration and limits
export async function GET() {
  return NextResponse.json({
    limits: {
      maxFileSize: UPLOAD_LIMITS.maxFileSize,
      maxFileSizeMB: UPLOAD_LIMITS.maxFileSize / (1024 * 1024),
      allowedFileTypes: UPLOAD_LIMITS.allowedTypes,
      maxFiles: UPLOAD_LIMITS.maxFiles,
    },
    storage: 'S3 + CloudFront',
    bucket: 'newsteps-images',
    region: 'us-west-2'
  });
} 