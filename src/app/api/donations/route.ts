import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Donation from '@/models/donation';
import User from '@/models/user';
import { DONATION_STATUSES } from '@/constants/config';
import { revalidatePath } from 'next/cache';
import { sendEmail, EmailTemplate } from '@/lib/email';
import { SessionUser } from '@/types/user';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // Get form data first
    const data = await request.json();
    
    // Connect to the database
    await connectToDatabase();

    // Check authentication (optional for shoe donations)
    const session = await getServerSession(authOptions);
    
    // Determine donor information and donation ID
    let user = null;
    let donorName = '';
    let donationId = '';
    
    if (session?.user) {
      // User is logged in - use their information
      const userId = (session.user as SessionUser).id;
      if (userId) {
        user = await User.findById(userId);
        if (user) {
          donorName = user.name;
          donationId = generateId('DON', user.name);
        }
      }
    }
    
    if (!user) {
      // User not logged in or not found - use provided donor information
      if (data.donorInfo && (data.donorInfo.firstName || data.donorInfo.lastName)) {
        donorName = `${data.donorInfo.firstName || ''} ${data.donorInfo.lastName || ''}`.trim();
      } else if (data.firstName && data.lastName) {
        donorName = `${data.firstName} ${data.lastName}`;
      } else if (data.name) {
        donorName = data.name;
      } else {
        donorName = 'Anonymous Donor';
      }
      
      donationId = generateId('DON', donorName);
    }

    // Determine if donor is in Bay Area
    const isBayArea = data.isBayArea || false;

    // Create donation record based on authentication status
    const donationData: any = {
      donationId,
      donationType: 'shoes',
      donationDescription: data.donationDescription,
      status: DONATION_STATUSES.SUBMITTED,
      statusHistory: [
        {
          status: DONATION_STATUSES.SUBMITTED,
          timestamp: new Date(),
          note: 'Donation submitted through the website'
        }
      ],
      notes: isBayArea 
        ? 'Donor is in Bay Area - can arrange for pickup or drop-off'
        : 'Donor is outside Bay Area - will need shipping instructions',
      isOffline: false, // This is an online donation
      isBayArea: isBayArea,
      numberOfShoes: data.numberOfShoes || 1,
      donationDate: new Date()
    };

    if (user) {
      // Authenticated user - use userId and get info from User model
      donationData.userId = user._id;
    } else {
      // Non-authenticated user - use donorInfo
      donationData.donorInfo = {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        name: donorName,
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || {}
      };
    }

    // Create and save the donation
    const newDonation = new Donation(donationData);
    const savedDonation = await newDonation.save();

    // Add the donation to the user's donations array (if user is logged in)
    if (user) {
      await User.updateOne(
        { _id: user._id },
        { $push: { donations: savedDonation._id } }
      );
    }

    // Send confirmation email
    try {
      const recipientEmail = user ? user.email : data.email;
      const recipientName = user ? user.name : donorName;
      
      if (recipientEmail) {
        await sendEmail(
          recipientEmail,
          EmailTemplate.DONATION_CONFIRMATION,
          {
            name: recipientName,
            donationId,
            donationDescription: data.donationDescription,
            isBayArea
          }
        );
      }
    } catch (emailError) {
      console.error('Error sending donation confirmation email:', emailError);
      // Continue with the process even if email fails
    }

    // Clear the cache for the donations page
    revalidatePath('/account/donations');

    // Return success response
    return NextResponse.json(
      { 
        success: true, 
        message: 'Donation submitted successfully', 
        donationId 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error submitting donation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit donation', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// GET user's donations (requires authentication)
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
    await connectToDatabase();
    
    // Get user information
    const user = await User.findOne({ email: session.user?.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch user's shoe donations
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