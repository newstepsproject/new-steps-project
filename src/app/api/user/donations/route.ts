import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { ensureDbConnected } from '@/lib/db-utils';
import Donation from '@/models/donation';
import User from '@/models/user';

// GET user's shoe donations
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to database
    await ensureDbConnected();
    
    // Get user information
    const user = await User.findOne({ email: session.user?.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch user's shoe donations
    // Note: Donations can be associated with userId (for logged-in users) 
    // or by email in donorInfo (for anonymous donations that were later claimed)
    const donations = await Donation.find({
      $or: [
        { userId: user._id },
        { 'donorInfo.email': user.email }
      ]
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      donations
    });
    
  } catch (error) {
    console.error('Error fetching user donations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donations' },
      { status: 500 }
    );
  }
}
