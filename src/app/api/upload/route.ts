import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { UPLOAD_LIMITS } from '@/constants/config';

/**
 * API endpoint for image uploads
 * Stores images locally instead of S3 for testing
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

    // Generate unique filename - store in root images directory to avoid subdirectory serving issues
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${folder}-${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;
    
    // Store in root images directory (not subdirectory) to avoid Next.js static serving issues
    const uploadDir = join(process.cwd(), 'public', 'images');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
      console.log('Upload directory already exists or created');
    }

    // Convert file to buffer and write to filesystem
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const filepath = join(uploadDir, filename);
    await writeFile(filepath, buffer);
    
    console.log('File uploaded successfully to:', filepath);

    // Return the public URL - now in root images directory
    const publicUrl = `/images/${filename}`;
    
    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename,
      size: file.size,
      type: file.type,
      message: 'Image uploaded successfully (local storage)',
      // Include upload limits info for debugging
      limits: {
        maxFileSize: UPLOAD_LIMITS.maxFileSize,
        maxFileSizeMB: UPLOAD_LIMITS.maxFileSize / (1024 * 1024),
        allowedFileTypes: UPLOAD_LIMITS.allowedTypes,
        maxFiles: UPLOAD_LIMITS.maxFiles,
      }
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

// GET endpoint to return upload configuration and limits
export async function GET() {
  return NextResponse.json({
    limits: {
      maxFileSize: UPLOAD_LIMITS.maxFileSize,
      maxFileSizeMB: UPLOAD_LIMITS.maxFileSize / (1024 * 1024),
      allowedFileTypes: UPLOAD_LIMITS.allowedTypes,
      maxFiles: UPLOAD_LIMITS.maxFiles,
    }
  });
} 