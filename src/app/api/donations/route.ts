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
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'You must be logged in to make a donation' },
        { status: 401 }
      );
    }

    // Get form data
    const data = await request.json();
    
    // Connect to the database
    await connectToDatabase();

    // Find user by ID - add type safety
    const userId = (session.user as SessionUser).id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate a unique donation ID using the proper format (DS-XXXX-YYYY)
    const donationId = generateId('DON', user.name);

    // Determine if donor is in Bay Area
    const isBayArea = data.isBayArea || false;

    // Create a new donation record using simplified model
    const newDonation = new Donation({
      donationId,
      userId: user._id, // Online donation - use userId
      // Do NOT set donorInfo for online donations - user data comes from User model
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
    });

    // Save the donation
    const savedDonation = await newDonation.save();

    // Add the donation to the user's donations array
    await User.updateOne(
      { _id: user._id },
      { $push: { donations: savedDonation._id } }
    );

    // Send confirmation email
    try {
      await sendEmail(
        user.email,
        EmailTemplate.DONATION_CONFIRMATION,
        {
          name: user.name,
          donationId,
          donationDescription: data.donationDescription,
          isBayArea
        }
      );
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