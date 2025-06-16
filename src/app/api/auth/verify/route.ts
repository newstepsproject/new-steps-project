import { NextRequest, NextResponse } from 'next/server';
import { verifyEmail } from '@/lib/verification';

// Disable static generation for this route
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get token from the URL using URL object
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'Missing token' },
        { status: 400 }
      );
    }

    // Verify the token
    const isVerified = await verifyEmail(token);

    if (isVerified) {
      return NextResponse.json(
        { message: 'Email verified successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 