/**
 * Public API: Used by /shoes page for browsing available shoes
 * No authentication required for GET requests
 * Returns only available shoes with inventory > 0
 */

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Shoe from '@/models/shoe';
import { SHOE_STATUSES } from '@/constants/config';

// Force dynamic rendering due to searchParams usage
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const sport = searchParams.get('sport');
    const brand = searchParams.get('brand');
    const gender = searchParams.get('gender');
    const size = searchParams.get('size');
    const condition = searchParams.get('condition');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || '-createdAt';
    
    // Build query - only show available shoes with inventory
    const query: any = {
      status: SHOE_STATUSES.AVAILABLE,
      inventoryCount: { $gt: 0 }
    };
    
    // Add filters if provided
    if (sport && sport !== 'all') query.sport = sport;
    if (brand && brand !== 'all') query.brand = brand;
    if (gender && gender !== 'all') query.gender = gender;
    if (size && size !== 'all') query.size = size;
    if (condition && condition !== 'all') query.condition = condition;
    
    // Add search functionality
    if (search) {
      query.$or = [
        { modelName: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { sport: { $regex: search, $options: 'i' } },
        { shoeId: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Fetch shoes with sorting
    const shoes = await Shoe.find(query)
      .sort(sort)
      .select('-__v') // Exclude version field
      .lean();
    
    return NextResponse.json({
      success: true,
      shoes,
      count: shoes.length
    });
    
  } catch (error) {
    console.error('Error fetching shoes:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch shoes',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 