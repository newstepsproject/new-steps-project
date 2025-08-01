import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Shoe from '@/models/shoe';
import Donation from '@/models/donation';
import { USER_ROLES, DONATION_STATUSES } from '@/constants/config';
import { generateId } from '@/lib/utils';

import { ensureDbConnected } from '@/lib/db-utils';

// Define shoe statuses locally since they're missing from config
const SHOE_STATUSES = {
  AVAILABLE: 'available',
  REQUESTED: 'requested',
  SHIPPED: 'shipped',
  UNAVAILABLE: 'unavailable'
};

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
    const shoeId = url.searchParams.get('shoeId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const page = parseInt(url.searchParams.get('page') || '1');
    const sort = url.searchParams.get('sort') || '-dateAdded'; // Default sort by newest
    const status = url.searchParams.get('status') || '';
    const brand = url.searchParams.get('brand') || '';
    
    // If searching by shoe ID, return single shoe
    if (shoeId) {
      const numericShoeId = parseInt(shoeId);
      if (isNaN(numericShoeId)) {
        return NextResponse.json({ error: 'Invalid shoe ID' }, { status: 400 });
      }
      
      const shoe = await Shoe.findOne({ shoeId: numericShoeId }).lean();
      
      if (!shoe) {
        return NextResponse.json({ error: 'Shoe not found' }, { status: 404 });
      }
      
      return NextResponse.json(shoe);
    }
    
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
    // Check authentication first
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check admin role
    if (!session.user?.role || session.user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Connect to database using Mongoose
    await ensureDbConnected();
    
    const data = await request.json();
    console.log('Received shoe data:', JSON.stringify(data, null, 2));
    
    // Validate required fields
    if (!data.brand || !data.modelName || !data.size) {
      return NextResponse.json({ 
        error: 'Missing required fields: brand, modelName, size' 
      }, { status: 400 });
    }

    // Create shoe using Mongoose model (shoeId will be auto-generated)
    const newShoe = new Shoe({
      brand: data.brand,
      modelName: data.modelName,
      gender: data.gender || 'unisex',
      size: data.size,
      color: data.color || '',
      sport: data.sport || '',
      condition: data.condition || 'good',
      description: data.description || '',
      features: data.features || [],
      images: data.images || [],
      status: data.status || SHOE_STATUSES.AVAILABLE,
      inventoryCount: data.inventoryCount || 1,
      inventoryNotes: data.inventoryNotes || '',
      dateAdded: new Date(),
      lastUpdated: new Date()
    });
    
    const savedShoe = await newShoe.save();
    
    console.log('Shoe saved with ID:', savedShoe.shoeId);
    
    return NextResponse.json({ 
      success: true, 
      shoe: savedShoe
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error adding shoe to inventory:', error);
    return NextResponse.json(
      { error: 'Failed to add shoe to inventory', details: error instanceof Error ? error.message : String(error) },
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