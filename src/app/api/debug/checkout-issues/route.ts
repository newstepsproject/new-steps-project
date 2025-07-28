import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Shoe from '@/models/shoe';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    // Get session for debugging
    const session = await getServerSession(authOptions);
    
    // Parse cart items from request
    const { cartItems } = await req.json();
    
    // Connect to database
    await connectToDatabase();
    
    // Debug each cart item
    const itemDebugInfo = [];
    
    for (const item of cartItems || []) {
      let shoeInfo = null;
      let inventoryCheck = 'not_found';
      
      if (item.inventoryId) {
        shoeInfo = await Shoe.findById(item.inventoryId);
        if (shoeInfo) {
          if (shoeInfo.inventoryCount <= 0) {
            inventoryCheck = 'out_of_stock';
          } else if (shoeInfo.status !== 'available') {
            inventoryCheck = 'status_unavailable';
          } else {
            inventoryCheck = 'available';
          }
        }
      }
      
      itemDebugInfo.push({
        cartItem: {
          id: item.id,
          shoeId: item.shoeId,
          inventoryId: item.inventoryId,
          brand: item.brand,
          modelName: item.modelName
        },
        database: shoeInfo ? {
          mongoId: shoeInfo._id,
          shoeId: shoeInfo.shoeId,
          brand: shoeInfo.brand,
          modelName: shoeInfo.modelName,
          status: shoeInfo.status,
          inventoryCount: shoeInfo.inventoryCount,
          lastUpdated: shoeInfo.lastUpdated
        } : null,
        inventoryCheck,
        wouldCause409: inventoryCheck !== 'available'
      });
    }
    
    // Count potential conflicts
    const conflictCount = itemDebugInfo.filter(item => item.wouldCause409).length;
    
    return NextResponse.json({
      session: {
        authenticated: !!session,
        email: session?.user?.email || null
      },
      cart: {
        itemCount: cartItems?.length || 0,
        items: itemDebugInfo
      },
      analysis: {
        totalItems: itemDebugInfo.length,
        availableItems: itemDebugInfo.filter(item => !item.wouldCause409).length,
        conflictingItems: conflictCount,
        wouldReturn409: conflictCount > 0,
        reason: conflictCount > 0 ? 'Some items are no longer available' : 'All items available'
      }
    });
    
  } catch (error) {
    console.error('Checkout debug API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to debug checkout',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 