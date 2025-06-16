import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { MoneyDonationFormData } from '@/components/forms/donation/MoneyDonationForm';
import connectDB from '@/lib/db';
import MoneyDonation from '@/models/MoneyDonation';
import { generateMoneyDonationReferenceNumber } from '@/lib/utils';
import { sendMoneyDonationConfirmation } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Connect to database 
    await connectDB();
    
    // Parse the request data
    const data: MoneyDonationFormData = await request.json();
    
    // Create a reference number in the format DM-XXXX-YYYY
    let donationId = generateMoneyDonationReferenceNumber(data.name);
    
    // Log the donation for testing
    console.log(`Test Money Donation [${donationId}]:`, {
      name: data.name,
      email: data.email,
      amount: data.amount,
    });
    
    // Check if this reference number already exists (unlikely but possible)
    const existingDonation = await MoneyDonation.findOne({ donationId });
    if (existingDonation) {
      // If it exists, generate a new one with a different random number
      const newDonationId = generateMoneyDonationReferenceNumber(data.name);
      console.log(`Reference number collision detected. New reference: ${newDonationId}`);
      donationId = newDonationId;
    }
    
    // Create a new money donation record (without requiring user authentication)
    const moneyDonation = await MoneyDonation.create({
      donationId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      amount: parseFloat(data.amount),
      notes: data.notes || '',
      status: 'submit', // Initial status is now "submit" (was "pending")
      createdAt: new Date(),
    });
    
    // Send confirmation email to the donor
    try {
      await sendMoneyDonationConfirmation({
        to: data.email,
        name: data.name,
        donationId,
        amount: data.amount,
      });
      console.log('✅ Test money donation confirmation email sent successfully to:', data.email);
    } catch (emailError) {
      console.error('⚠️ Failed to send test money donation confirmation email:', emailError);
      // Don't fail the entire request if email fails - just log the error
    }
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Test money donation submitted successfully',
      donationId 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error processing test money donation:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process test donation',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'Test money donation API endpoint is working' 
  });
} 