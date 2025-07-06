import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/user';
import ShoeRequest, { ShoeRequestStatus } from '@/models/shoeRequest';
import Shoe from '@/models/shoe';
import { generateRequestId } from '@/lib/utils';
import { sendEmail, EmailTemplate } from '@/lib/email';
import { getAppSettings } from '@/lib/settings';

export async function POST(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const requestData = await req.json();
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
      return NextResponse.json(
        { error: 'No items selected for request' },
        { status: 400 }
      );
    }

    // Enforce 2-shoe limit
    if (items.length > 2) {
      return NextResponse.json(
        { error: 'Maximum 2 shoes allowed per request' },
        { status: 400 }
      );
    }

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required personal information' },
        { status: 400 }
      );
    }

    // Additional validation for shipping method
    if (deliveryMethod === 'shipping' && (!address || !city || !state || !zipCode)) {
      return NextResponse.json(
        { error: 'Shipping address is required for shipping method' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();
    
    // Get user information
    const user = await User.findOne({ email: session.user?.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate and process inventory items
    const processedItems = [];
    const unavailableItems = [];

    for (const item of items) {
      if (!item.inventoryId) {
        unavailableItems.push(`${item.brand} ${item.name} (No inventory ID)`);
        continue;
      }

      // Check if shoe is still available in inventory
      const shoe = await Shoe.findById(item.inventoryId);
      if (!shoe) {
        unavailableItems.push(`${item.brand} ${item.name} (Not found)`);
        continue;
      }

      if (shoe.inventoryCount <= 0 || shoe.status !== 'available') {
        unavailableItems.push(`${item.brand} ${item.name} (No longer available)`);
        continue;
      }

      // Process the item with proper linking
      processedItems.push({
        shoeId: shoe.shoeId, // Use actual shoe ID from inventory
        inventoryId: shoe._id,
        brand: shoe.brand,
        name: shoe.modelName,
        size: shoe.size,
        gender: shoe.gender,
        sport: shoe.sport,
        condition: shoe.condition,
        notes: item.notes || ''
      });
    }

    // Check if any items are unavailable
    if (unavailableItems.length > 0) {
      return NextResponse.json(
        { 
          error: 'Some items are no longer available',
          unavailableItems
        },
        { status: 409 }
      );
    }

    if (processedItems.length === 0) {
      return NextResponse.json(
        { error: 'No valid items to process' },
        { status: 400 }
      );
    }

    // Create a unique request ID
    const requestId = generateRequestId();

    // Calculate shipping fee
    const settings = await getAppSettings();
    const shippingFee = deliveryMethod === 'pickup' ? 0 : settings.shippingFee;
    const totalCost = shippingFee;

    // Create the shoe request
    const shoeRequest = new ShoeRequest({
      requestId,
      requestorInfo: {
        firstName,
        lastName,
        email,
        phone
      },
      items: processedItems,
      shippingInfo: {
        street: address,
        city,
        state,
        zipCode,
        country: country || 'USA'
      },
      notes,
      statusHistory: [{
        status: ShoeRequestStatus.SUBMITTED,
        timestamp: new Date(),
        note: 'Request submitted by user'
      }],
      currentStatus: ShoeRequestStatus.SUBMITTED,
      userId: user._id,
      isOffline: false,
      shippingFee,
      totalCost
    });

    // Save the request
    await shoeRequest.save();

    // Update inventory for requested shoes
    for (const item of processedItems) {
      await Shoe.findByIdAndUpdate(
        item.inventoryId,
        { 
          $inc: { inventoryCount: -1 },
          $set: { 
            status: 'requested',
            lastUpdated: new Date()
          }
        }
      );
      console.log(`[INVENTORY] Allocated shoe ${item.shoeId} for request ${requestId}`);
    }

    // Send confirmation email
    try {
      await sendEmail(
        email,
        EmailTemplate.SHOE_REQUEST_CONFIRMATION,
        {
          firstName,
          requestId,
          itemCount: processedItems.length,
          items: processedItems,
          deliveryMethod,
          address,
          city,
          state,
          zipCode,
          shippingFee
        }
      );

      console.log(`[EMAIL] Sent confirmation to ${email} for request ${requestId}`);
    } catch (emailError) {
      console.error('[EMAIL] Failed to send confirmation:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Shoe request submitted successfully',
      totalCost,
      shippingFee
    });

  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch user's requests
export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();
    
    // Get user information
    const user = await User.findOne({ email: session.user?.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch user's requests with populated shoe data
    const requests = await ShoeRequest.find({ userId: user._id })
      .populate('items.inventoryId', 'shoeId brand modelName sport condition images')
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      requests
    });
    
  } catch (error) {
    console.error('Error fetching shoe requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}