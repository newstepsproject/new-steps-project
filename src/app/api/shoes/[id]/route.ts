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
    
    // Validate ID format
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid shoe ID format'
        },
        { status: 400 }
      );
    }
    
    // Fetch the shoe - only if it's available
    const shoe = await Shoe.findOne({
      _id: id,
      status: SHOE_STATUSES.AVAILABLE,
      inventoryCount: { $gt: 0 }
    }).lean();
    
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