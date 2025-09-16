import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { ensureDbConnected } from '@/lib/db-utils';
import MoneyDonation from '@/models/MoneyDonation';
import User from '@/models/user';

// GET user's money donations
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

    // Fetch user's money donations
    // Note: Money donations can be associated with userId (for logged-in users) 
    // or by email (for anonymous donations that were later claimed)
    const moneyDonations = await MoneyDonation.find({
      $or: [
        { userId: user._id },
        { email: user.email }
      ]
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      moneyDonations
    });
    
  } catch (error) {
    console.error('Error fetching user money donations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch money donations' },
      { status: 500 }
    );
  }
}
