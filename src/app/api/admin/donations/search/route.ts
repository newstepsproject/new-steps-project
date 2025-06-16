import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Donation from '@/models/donation';

// Force dynamic rendering due to headers usage
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query) {
      return NextResponse.json({ donations: [] });
    }

    // Search donations by donor name, email, or donation ID
    const donations = await Donation.find({
      $or: [
        { donationId: { $regex: query, $options: 'i' } },
        { 'userId.email': { $regex: query, $options: 'i' } },
        { 'userId.firstName': { $regex: query, $options: 'i' } },
        { 'userId.lastName': { $regex: query, $options: 'i' } }
      ]
    })
    .populate('userId', 'firstName lastName email')
    .limit(10)
    .sort({ createdAt: -1 });

    return NextResponse.json({
      donations: donations.map(donation => ({
        _id: donation._id,
        donationId: donation.donationId,
        userId: donation.userId,
        donationDescription: donation.donationDescription,
        status: donation.status,
        createdAt: donation.createdAt
      }))
    });
  } catch (error) {
    console.error('Error searching donations:', error);
    return NextResponse.json(
      { error: 'Failed to search donations' },
      { status: 500 }
    );
  }
} 