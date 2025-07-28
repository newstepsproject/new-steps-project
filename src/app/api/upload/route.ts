import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Upload configuration
const UPLOAD_LIMITS = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 5,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
};

/**
 * API endpoint for image uploads
 * Stores images locally for immediate access (S3 has permission issues)
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'general';

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

    // Generate unique filename - store in subdirectory for organization
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${folder}-${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`;
    
    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'images', folder);
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

    // Return the public URL - organized in subfolder
    const publicUrl = `/images/${folder}/${filename}`;
    
    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: filename,
      size: file.size,
      type: file.type,
      message: 'Image uploaded successfully to local storage',
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

/**
 * GET endpoint to return upload configuration
 */
export async function GET() {
  return NextResponse.json({
    limits: {
      maxFileSize: UPLOAD_LIMITS.maxFileSize,
      maxFileSizeMB: UPLOAD_LIMITS.maxFileSize / (1024 * 1024),
      allowedFileTypes: UPLOAD_LIMITS.allowedTypes,
      maxFiles: UPLOAD_LIMITS.maxFiles,
    },
    storage: 'Local File System',
    directory: 'public/images/[folder]/',
    note: 'Reverted to local storage due to S3/CloudFront permission issues'
  });
} 