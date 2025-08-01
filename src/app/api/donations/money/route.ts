import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import MoneyDonation from '@/models/MoneyDonation';
import { nanoid } from 'nanoid';
import { sendMoneyDonationConfirmation } from '@/lib/email';
import { MoneyDonationFormData } from '@/components/forms/donation/MoneyDonationForm';
import { Session } from 'next-auth';
import { CustomSession } from '@/types/auth';
import { ReferenceIdGenerators } from '@/lib/reference-id-generator';

// Define a custom session type that includes our extended user properties
type CustomSession = Session & {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  }
};

export async function POST(request: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();
    
    // Get the session (optional, if user is logged in)
    const session = await getServerSession(authOptions) as CustomSession | null;
    
    // Parse the request data
    const data: MoneyDonationFormData = await request.json();
    
    // Create a reference number in the format DM-XXXX-YYYY
    const donorName = data.name || `${data.firstName} ${data.lastName}`;
    let donationId = ReferenceIdGenerators.moneyDonation(donorName);
    
    console.log(`[Money Donation API] Generated reference number: ${donationId} for donor: ${donorName}`);
    
    // Check if this reference number already exists (very unlikely but possible)
    const existingDonation = await MoneyDonation.findOne({ donationId });
    if (existingDonation) {
      // If it exists, generate a new one with a different random number
      console.log(`[Money Donation API] Reference number collision detected: ${donationId}`);
      const newDonationId = ReferenceIdGenerators.moneyDonation(donorName);
      console.log(`[Money Donation API] Generated new reference number: ${newDonationId}`);
      donationId = newDonationId;
    }
    
    // Create a new money donation record
    const moneyDonation = await MoneyDonation.create({
      donationId,
      firstName: data.firstName,
      lastName: data.lastName,
      name: data.name || donorName, // Keep for backward compatibility
      email: data.email,
      phone: data.phone,
      amount: parseFloat(data.amount),
      notes: data.notes || '',
      status: 'submitted', // Fixed status to use proper enum value
      userId: session?.user?.id || null, // Associate with user if logged in
      isOffline: false, // This is an online donation
      createdAt: new Date(),
    });
    
    // Send confirmation email to the donor
    try {
      await sendMoneyDonationConfirmation({
        to: data.email,
        name: donorName,
        donationId,
        amount: data.amount,
      });
    } catch (emailError) {
      console.error('Error sending money donation confirmation email:', emailError);
      // Continue with the process even if email fails
    }
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Money donation submitted successfully',
      donationId 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error processing money donation:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process donation' 
    }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Money donation API endpoint is working' 
  });
} 