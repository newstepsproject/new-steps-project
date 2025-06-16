import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToS3 } from '@/lib/s3';
import { UPLOAD_LIMITS } from '@/constants/config';

/**
 * Test API endpoint for image uploads (no authentication required)
 * Accepts multipart form data with files
 */
export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'test-uploads';

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

    // Log for debugging
    console.log('Test upload successful:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      s3Url,
      cloudFrontUrl
    });

    // Return the URLs
    return NextResponse.json(
      {
        success: true,
        urls: {
          s3Url,
          cloudFrontUrl,
        },
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error in test upload:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload test image', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

/**
 * Test endpoint for checking allowed file types and size limits
 */
export async function GET() {
  return NextResponse.json(
    {
      maxFileSize: UPLOAD_LIMITS.maxFileSize,
      maxFileSizeMB: UPLOAD_LIMITS.maxFileSize / (1024 * 1024),
      allowedFileTypes: UPLOAD_LIMITS.allowedTypes,
      maxFiles: UPLOAD_LIMITS.maxFiles,
      testEndpoint: true
    },
    { status: 200 }
  );
} 