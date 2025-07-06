import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';

/**
 * Test endpoint for processing shoe requests without authentication
 * This is for development and testing purposes only
 */
export async function POST(req: NextRequest) {
  try {
    console.log('📝 Test shoe request submission received');
    
    // Parse request body
    const requestData = await req.json();
    console.log('Request data:', JSON.stringify(requestData, null, 2));
    
    const { 
      items, // Array of shoe items from cart
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      deliveryMethod,
      notes
    } = requestData;

    // Validate required fields
    if (!items || !items.length) {
      console.error('No items selected for request');
      return NextResponse.json(
        { error: 'No items selected for request' },
        { status: 400 }
      );
    }

    if (!firstName || !lastName || !email || !phone) {
      console.error('Missing required personal information');
      return NextResponse.json(
        { error: 'Missing required personal information' },
        { status: 400 }
      );
    }

    // Additional validation for shipping method
    if (deliveryMethod === 'shipping' && (!address || !city || !state || !zipCode)) {
      console.error('Shipping address is required for shipping method');
      return NextResponse.json(
        { error: 'Shipping address is required for shipping method' },
        { status: 400 }
      );
    }

    // Create a unique request ID
    const requestId = `TEST-${uuidv4()}`;
    
    // Create request object
    const shoeRequest = {
      requestId,
      userId: 'test-user-id',
      items: items.map((item: any) => ({
        shoeId: item.shoeId, // Use actual shoe ID, not generic id
        name: item.name,
        brand: item.brand,
        gender: item.gender,
        size: item.size,
        color: item.color,
        condition: item.condition,
        image: item.image
      })),
      requestorInfo: {
        firstName,
        lastName,
        email,
        phone
      },
      shippingInfo: deliveryMethod === 'shipping' ? {
        address,
        city,
        state,
        zipCode,
        country
      } : null,
      deliveryMethod,
      notes,
      statusHistory: [
        {
          status: 'submitted',
          timestamp: new Date(),
          note: 'Test request submitted'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
      isTest: true
    };

    // Connect to database (optional - for testing persistence)
    try {
      await connectToDatabase();
      const db = mongoose.connection.db;
      if (db) {
        await db.collection('test_shoe_requests').insertOne(shoeRequest);
        console.log('✅ Test request saved to database with ID:', requestId);
      } else {
        console.error('⚠️ Database connection not available');
      }
    } catch (dbError) {
      console.error('⚠️ Could not save to database (continuing anyway):', dbError);
    }

    console.log('✅ Test shoe request processed successfully');

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Test shoe request submitted successfully',
      requestId
    });
    
  } catch (error) {
    console.error('❌ Error processing test shoe request:', error);
    return NextResponse.json(
      { error: 'Failed to process test request' },
      { status: 500 }
    );
  }
}

// Simple GET endpoint to check if the API is working
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Test shoe request API is operational'
  });
} 