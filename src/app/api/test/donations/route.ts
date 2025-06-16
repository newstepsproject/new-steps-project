import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { DONATION_STATUSES } from '@/constants/config';

/**
 * Test endpoint for donation submissions during development
 * Does not require authentication and simulates database operations
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[TEST API] Processing donation submission');
    
    // Handle regular JSON submission
    const data = await request.json();
    console.log('[TEST API] Received data:', data);
    
    // Generate a unique donation ID
    const donationId = `TEST-DN-${uuid().substring(0, 8).toUpperCase()}`;
    console.log('[TEST API] Generated donation ID:', donationId);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Log the donation data
    console.log('[TEST API] Donation data:', {
      ...data,
      donationId
    });
    
    // Return a success response
    const response = {
      success: true,
      message: 'Test donation submitted successfully',
      donationId,
      timestamp: new Date().toISOString()
    };
    
    console.log('[TEST API] Sending response:', response);
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[TEST API] Error processing donation:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('[TEST API] Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }
    
    const errorResponse = {
      error: 'Failed to process donation submission',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
    
    console.log('[TEST API] Sending error response:', errorResponse);
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * Simple GET endpoint to check API status
 */
export async function GET() {
  const response = {
    status: 'Test donation API is operational',
    timestamp: new Date().toISOString(),
    testDonationId: `TEST-DN-${uuid().substring(0, 8).toUpperCase()}`
  };
  
  console.log('[TEST API] GET request response:', response);
  
  return NextResponse.json(response);
} 