import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Shoe from '@/models/shoe';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is an admin
    const user = session.user as any;
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Connect to database
    await connectToDatabase();
    
    // Find shoes that are available but have 0 inventory count (affected by the bug)
    const affectedShoes = await Shoe.find({
      status: 'available',
      inventoryCount: 0
    });
    
    console.log(`Found ${affectedShoes.length} shoes affected by inventory bug`);
    
    // Fix each affected shoe
    const fixResults = [];
    
    for (const shoe of affectedShoes) {
      const result = await Shoe.findByIdAndUpdate(
        shoe._id,
        {
          $set: {
            inventoryCount: 1,
            lastUpdated: new Date()
          }
        },
        { new: true }
      );
      
      fixResults.push({
        shoeId: shoe.shoeId,
        mongoId: shoe._id,
        brand: shoe.brand,
        modelName: shoe.modelName,
        oldInventoryCount: 0,
        newInventoryCount: result?.inventoryCount || 1,
        status: result?.status
      });
      
      console.log(`Fixed inventory for shoe ID ${shoe.shoeId}: count 0 → 1`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed inventory for ${affectedShoes.length} shoes`,
      fixedShoes: fixResults,
      summary: {
        totalFixed: affectedShoes.length,
        allShoesNowAvailable: fixResults.every(shoe => shoe.newInventoryCount > 0)
      }
    });
    
  } catch (error) {
    console.error('Fix inventory API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fix inventory',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 