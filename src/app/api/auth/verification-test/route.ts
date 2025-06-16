import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User, { UserDocument } from '@/models/user';
import VerificationToken from '@/models/verification-token';
import { Types } from 'mongoose';

/**
 * GET /api/auth/verification-test
 * Retrieve user verification status
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'Email is required' },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();
    
    // Find user by email
    const user = await User.findOne({ email }).select('email emailVerified');
    
    return NextResponse.json({
      status: 'success',
      user: user ? {
        email: user.email,
        emailVerified: !!user.emailVerified
      } : null
    });
  } catch (error) {
    console.error('Error checking user verification status:', error);
    return NextResponse.json(
      { error: 'Failed to check user verification status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/verification-test
 * Create a verification token for testing
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Ensure user._id is a valid ObjectId
    if (!(user._id instanceof Types.ObjectId)) {
      throw new Error('Invalid user ID type');
    }
    
    // Get user ID as string
    const userId = user._id.toString();
    
    // Generate a token
    const token = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
                 
    // Create a verification token
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);
    
    // Delete existing tokens for this user
    await VerificationToken.deleteMany({ userId: user._id });
    
    // Create new token
    await VerificationToken.create({
      userId: user._id,
      token,
      expires
    });
    
    return NextResponse.json({
      status: 'success',
      token: token,
      expires: expires.toISOString()
    });
  } catch (error) {
    console.error('Error creating verification token:', error);
    return NextResponse.json(
      { error: 'Failed to create verification token' },
      { status: 500 }
    );
  }
} 