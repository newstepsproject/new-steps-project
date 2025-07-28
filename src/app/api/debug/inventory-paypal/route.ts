import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import Shoe from '@/models/shoe';

export async function GET(req: NextRequest) {
  try {
    // Check PayPal environment
    const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const paypalSecret = process.env.PAYPAL_CLIENT_SECRET;
    
    // Connect to database
    await connectToDatabase();
    
    // Check shoe with ID 1
    const shoe1 = await Shoe.findOne({ shoeId: 1 });
    
    // Get first few shoes to check inventory
    const allShoes = await Shoe.find({}).limit(5).select('shoeId brand modelName status inventoryCount');
    
    return NextResponse.json({
      paypal: {
        clientIdExists: !!paypalClientId,
        clientIdLength: paypalClientId?.length || 0,
        clientIdPreview: paypalClientId ? `${paypalClientId.substring(0, 10)}...` : 'Not set',
        secretExists: !!paypalSecret,
        secretLength: paypalSecret?.length || 0
      },
      inventory: {
        shoe1Found: !!shoe1,
        shoe1Details: shoe1 ? {
          mongoId: shoe1._id,
          shoeId: shoe1.shoeId,
          brand: shoe1.brand,
          modelName: shoe1.modelName,
          status: shoe1.status,
          inventoryCount: shoe1.inventoryCount,
          lastUpdated: shoe1.lastUpdated
        } : null,
        allShoes: allShoes.map(shoe => ({
          mongoId: shoe._id,
          shoeId: shoe.shoeId,
          brand: shoe.brand,
          modelName: shoe.modelName,
          status: shoe.status,
          inventoryCount: shoe.inventoryCount
        }))
      }
    });
    
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get debug info',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 