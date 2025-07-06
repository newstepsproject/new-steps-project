import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Donation from '@/models/donation';
import Shoe from '@/models/shoe';
import { DONATION_STATUSES, SHOE_STATUSES } from '@/constants/config';
import { revalidatePath } from 'next/cache';
import mongoose from 'mongoose';

import { ensureDbConnected } from '@/lib/db-utils';
interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('[POST] Received request to convert donation to inventory');
    
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    console.log('[POST] Session:', session ? 'exists' : 'null');
    
    if (!session?.user) {
      console.log('[POST] Authentication failed: No session or user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is an admin
    const user = session.user as SessionUser;
    console.log('[POST] User role:', user.role);
    
    if (user.role !== 'admin') {
      console.log('[POST] Authorization failed: User is not an admin');
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Get request data
    const data = await request.json();
    console.log('[POST] Request data:', data);
    const { donationId } = data;

    if (!donationId) {
      return NextResponse.json(
        { error: 'Donation ID is required' },
        { status: 400 }
      );
    }

    // Connect to the database
    await ensureDbConnected();

    // Find the donation
    console.log('[POST] Looking for donation with ID:', donationId);
    const donation = await Donation.findOne({ donationId });
    
    if (!donation) {
      console.log('[POST] Donation not found with ID:', donationId);
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      );
    }
    
    console.log('[POST] Found donation:', donation._id.toString(), 'current status:', donation.status);

    // Validate donation status
    if (donation.status !== DONATION_STATUSES.RECEIVED) {
      console.log('[POST] Invalid donation status for conversion:', donation.status);
      return NextResponse.json(
        { error: 'Only donations with "received" status can be converted to inventory' },
        { status: 400 }
      );
    }

    // Parse donation description to create inventory items
    // In a real-world scenario, you might have more structured data
    // For this example, we'll create a generic inventory item
    
    const timestamp = Date.now().toString().slice(-6);
    const randomLetters = Math.random().toString(36).substring(2, 5).toUpperCase();
    const sku = `DN${timestamp}${randomLetters}`;
    
    // Create an inventory item from the donation
    const newShoe = new Shoe({
      sku,
      brand: 'Other', // Default value
      modelName: 'Donated Shoe',
      gender: 'unisex',
      size: 'Unknown',
      color: 'Unknown',
      sport: 'Other',
      condition: 'good',
      description: donation.donationDescription,
      images: ['https://placehold.co/400x300?text=Donated+Shoe'], // Default placeholder image
      status: SHOE_STATUSES.AVAILABLE,
      donationId: donation._id, // Link to the original donation
      inventoryCount: 1,
      inventoryNotes: `Created from donation ${donationId}`,
      dateAdded: new Date()
    });
    
    await newShoe.save();
    console.log('[POST] Created new inventory item with SKU:', sku);

    // Create status history entry
    const statusEntry = {
      status: DONATION_STATUSES.PROCESSED,
      timestamp: new Date(),
      note: `Donation processed and converted to inventory item with SKU: ${sku}`
    };
    console.log('[POST] Created status history entry:', statusEntry);

    // Update the donation status to processed
    const updateResult = await Donation.updateOne(
      { donationId },
      {
        $set: { status: DONATION_STATUSES.PROCESSED },
        $push: { statusHistory: statusEntry }
      }
    );
    
    console.log('[POST] Update result:', updateResult);
    
    if (updateResult.modifiedCount !== 1) {
      console.log('[POST] Warning: Donation not modified');
    }
    
    // Revalidate relevant paths
    revalidatePath('/admin/shoes');
    revalidatePath('/admin/shoe-donations');
    
    return NextResponse.json({
      success: true,
      message: 'Donation converted to inventory successfully',
      inventoryItem: {
        id: newShoe._id,
        sku: newShoe.sku
      }
    });
    
  } catch (error) {
    console.error('Error converting donation to inventory:', error);
    return NextResponse.json(
      { 
        error: 'Failed to convert donation to inventory', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 