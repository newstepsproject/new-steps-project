import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ensureDbConnected } from '@/lib/db-utils';
import Donation from '@/models/donation';
import { SessionUser } from '@/types/user';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is an admin
    const user = session.user as SessionUser;
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Get the donation reference ID from the URL
    const { id: referenceId } = await params;
    
    if (!referenceId) {
      return NextResponse.json(
        { error: 'Donation reference ID is required' },
        { status: 400 }
      );
    }

    // Connect to the database
    await ensureDbConnected();

    // Find the donation by reference ID
    console.log(`[GET] Looking for donation with reference: ${referenceId}`);
    const donation = await Donation.findOne({ donationId: referenceId });
    
    if (!donation) {
      console.log(`[GET] Donation not found with reference: ${referenceId}`);
      return NextResponse.json(
        { error: 'Donation not found', success: false },
        { status: 404 }
      );
    }
    
    console.log(`[GET] Found donation with reference: ${referenceId}`);
    
    // Check if the donation status is processed or cancelled
    if (donation.status === 'processed') {
      console.log(`[GET] Donation with reference ${referenceId} has already been processed`);
      return NextResponse.json(
        { 
          error: 'This donation has already been processed and added to inventory', 
          success: false,
          status: donation.status
        },
        { status: 400 }
      );
    }
    
    if (donation.status === 'cancelled') {
      console.log(`[GET] Donation with reference ${referenceId} has been cancelled`);
      return NextResponse.json(
        { 
          error: 'This donation has been cancelled and cannot be processed', 
          success: false,
          status: donation.status
        },
        { status: 400 }
      );
    }
    
    // Return donation details (focus on donor information)
    return NextResponse.json({
      success: true,
      donation: {
        _id: donation._id,
        donationId: donation.donationId,
        donorInfo: donation.donorInfo || {},
        donorAddress: donation.donorAddress || {},
        status: donation.status,
        isBayArea: donation.isBayArea || false,
        createdAt: donation.createdAt,
        numberOfShoes: donation.numberOfShoes || 0,
        processedShoes: donation.processedShoes || 0,
        isFullyProcessed: donation.processedShoes >= donation.numberOfShoes
      }
    });
  } catch (error) {
    console.error('Error fetching donation by reference:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch donation', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 