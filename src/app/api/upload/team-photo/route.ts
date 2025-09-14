import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SessionUser } from '@/types/user';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Force dynamic to handle file uploads
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify user is an admin
    const user = session.user as SessionUser;
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    // Parse the multipart form data
    const data = await request.formData();
    const file: File | null = data.get('photo') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Generate unique filename with environment prefix to prevent dev/prod collisions
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const environment = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
    const randomString = Math.random().toString(36).substring(2);
    const fileName = `${environment}-officer-${timestamp}-${randomString}.${fileExtension}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const storageProvider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();

    if (storageProvider === 's3') {
      const region = process.env.S3_REGION || '';
      const bucket = process.env.S3_BUCKET || '';
      const prefix = process.env.S3_PREFIX || '';
      const publicBase = process.env.S3_PUBLIC_URL || '';

      if (region && bucket) {
        const key = [prefix, 'team', fileName].filter(Boolean).join('/');
        const s3 = new S3Client({ region });
        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buffer,
          ContentType: file.type,
          ACL: 'public-read'
        }));
        const url = publicBase
          ? `${publicBase.replace(/\/$/, '')}/team/${fileName}`
          : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
        return NextResponse.json({ success: true, fileName, url, provider: 's3', message: 'Photo uploaded successfully' });
      }
    }

    // Local fallback
    const filePath = join(process.cwd(), 'public/images/team', fileName);
    await writeFile(filePath, buffer);
    return NextResponse.json({ success: true, fileName, url: `/images/team/${fileName}`, provider: 'local', message: 'Photo uploaded successfully' });

  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
} 