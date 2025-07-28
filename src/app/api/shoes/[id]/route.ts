/**
 * Public API: Used by /shoes/[id] page for viewing shoe details
 * No authentication required for GET requests
 * Returns only available shoes with inventory > 0
 * Increments view count for analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Shoe from '@/models/shoe';
import { SHOE_STATUSES } from '@/constants/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    
    const { id } = params;
    
    // Validate that an ID was provided
    if (!id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Shoe ID is required'
        },
        { status: 400 }
      );
    }
    
    let query: any;
    
    // Check if it's a MongoDB ObjectId format (24 hex characters)
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      query = { _id: id };
    } 
    // Check if it's a numeric shoeId
    else if (/^\d+$/.test(id)) {
      query = { shoeId: parseInt(id, 10) };
    }
    // Invalid format
    else {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid shoe ID format. Must be either a MongoDB ObjectId or numeric shoe ID.'
        },
        { status: 400 }
      );
    }
    
    // Add availability filters to the query
    query.status = SHOE_STATUSES.AVAILABLE;
    query.inventoryCount = { $gt: 0 };
    
    // Fetch the shoe - only if it's available
    const shoe = await Shoe.findOne(query).lean();
    
    if (!shoe) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Shoe not found or not available'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      shoe
    });
    
  } catch (error) {
    console.error('Error fetching shoe:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch shoe',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 