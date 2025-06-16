import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Shoe from '@/models/shoe';
import Donation from '@/models/donation';
import { USER_ROLES, DONATION_STATUSES } from '@/constants/config';
import { generateId } from '@/lib/utils';

import { ensureDbConnected } from '@/lib/db-utils';
// GET handler to fetch all shoes for inventory
export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!session.user?.role || session.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Connect to database
    await ensureDbConnected();
    
    // Parse query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const page = parseInt(url.searchParams.get('page') || '1');
    const sort = url.searchParams.get('sort') || '-dateAdded'; // Default sort by newest
    const status = url.searchParams.get('status') || '';
    const brand = url.searchParams.get('brand') || '';
    
    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (brand) query.brand = brand;
    
    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const shoes = await Shoe.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await Shoe.countDocuments(query);
    
    // Look up donation reference numbers for shoes with donationId
    const shoesWithReferenceNumbers = await Promise.all(shoes.map(async (shoe) => {
      if (shoe.donationId) {
        try {
          // Find the donation to get the reference number
          const donation = await Donation.findById(shoe.donationId).select('donationId').lean();
          if (donation) {
            return {
              ...shoe,
              referenceNumber: donation.donationId // Use donationId as the reference number
            };
          }
        } catch (err) {
          console.error('Error fetching donation reference:', err);
        }
      }
      return shoe;
    }));
    
    return NextResponse.json({
      shoes: shoesWithReferenceNumbers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching shoes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler to create a new shoe in inventory
export async function POST(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const session = await getServerSession(authOptions);
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    console.log('Received shoe data:', JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.brand) {
      return NextResponse.json({ error: 'Brand is required' }, { status: 400 });
    }
    
    if (!data.size) {
      return NextResponse.json({ error: 'Size is required' }, { status: 400 });
    }
    
    // If SKU is not provided, generate one
    if (!data.sku) {
      const timestamp = Date.now().toString().slice(-6);
      const brandCode = (data.brand || 'XX').substring(0, 2).toUpperCase();
      const randomCode = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      data.sku = `${brandCode}${timestamp}${randomCode}`;
    }
    
    // Generate shoe ID if not provided
    if (!data.shoeId) {
      data.shoeId = generateId('SHO');
    }
    
    // Create the shoe record
    const shoeRecord = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
    };
    
    const result = await db.collection('shoes').insertOne(shoeRecord);
    
    return NextResponse.json({ 
      success: true, 
      shoe: { ...shoeRecord, _id: result.insertedId }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error adding shoe to inventory:', error);
    return NextResponse.json(
      { error: 'Failed to add shoe to inventory' },
      { status: 500 }
    );
  }
}

// PATCH handler to update inventory count or other shoe details
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!session.user?.role || session.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Connect to database
    await ensureDbConnected();
    
    // Parse request data
    const data = await request.json();
    const { id, ...updateData } = data;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Shoe ID is required' },
        { status: 400 }
      );
    }
    
    // Update shoe
    const shoe = await Shoe.findByIdAndUpdate(
      id,
      { ...updateData, lastUpdated: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!shoe) {
      return NextResponse.json(
        { error: 'Shoe not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(shoe);
  } catch (error) {
    console.error('Error updating shoe:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE handler to remove a shoe from inventory
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!session.user?.role || session.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Connect to database
    await ensureDbConnected();
    
    // Get shoe ID from query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Shoe ID is required' },
        { status: 400 }
      );
    }
    
    // Delete shoe
    const result = await Shoe.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Shoe not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: 'Shoe deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting shoe:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 