import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import ShoeRequest, { ShoeRequestStatus } from '@/models/shoeRequest';
import Shoe from '@/models/shoe';
import { SessionUser } from '@/types/user';
import User from '@/models/user';
import { sendEmail, sendCustomEmail } from '@/lib/email';
import { generateRequestId } from '@/lib/utils';
import { ensureDbConnected } from '@/lib/db-utils';

const REQUEST_STATUSES = {
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  SHIPPED: 'shipped',
  REJECTED: 'rejected'
};

// GET all shoe requests (admin only)
export async function GET(request: NextRequest) {
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
    const user = session.user as SessionUser;
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Connect to the database
    await ensureDbConnected();

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const sort = url.searchParams.get('sort') || '-createdAt'; // Default to newest first
    const search = url.searchParams.get('search') || '';

    // Build query
    const query: any = {};
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query['currentStatus'] = status;
    }

    // Add search functionality
    if (search) {
      // For numeric search, try to match exact shoe ID
      const numericSearch = parseInt(search, 10);
      if (!isNaN(numericSearch)) {
        query.$or = [
          { requestId: { $regex: search, $options: 'i' } },
          { 'requestorInfo.firstName': { $regex: search, $options: 'i' } },
          { 'requestorInfo.lastName': { $regex: search, $options: 'i' } },
          { 'requestorInfo.email': { $regex: search, $options: 'i' } },
          { 'items.shoeId': numericSearch },
          { 'items.brand': { $regex: search, $options: 'i' } }
        ];
      } else {
        // For text search, search in string fields only
        query.$or = [
          { requestId: { $regex: search, $options: 'i' } },
          { 'requestorInfo.firstName': { $regex: search, $options: 'i' } },
          { 'requestorInfo.lastName': { $regex: search, $options: 'i' } },
          { 'requestorInfo.email': { $regex: search, $options: 'i' } },
          { 'items.brand': { $regex: search, $options: 'i' } }
        ];
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination and sorting
    const sortObj: any = {};
    sortObj[sort.startsWith('-') ? sort.substring(1) : sort] = sort.startsWith('-') ? -1 : 1;
    
    const requests = await ShoeRequest.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate('items.inventoryId', 'shoeId brand modelName sport condition')
      .lean();

    // Get total count for pagination
    const totalRequests = await ShoeRequest.countDocuments(query);

    return NextResponse.json({
      requests,
      pagination: {
        total: totalRequests,
        page,
        limit,
        totalPages: Math.ceil(totalRequests / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching shoe requests:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch shoe requests', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// Update shoe request status with business logic
export async function PATCH(request: NextRequest) {
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
    const user = session.user as SessionUser;
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Get request data
    const data = await request.json();
    const { requestId, status, note, requestorInfo, shippingInfo, notes } = data;

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Connect to the database
    await ensureDbConnected();

    // Find the request
    const shoeRequest = await ShoeRequest.findOne({ requestId }).populate('items.inventoryId');
    
    if (!shoeRequest) {
      return NextResponse.json(
        { error: 'Shoe request not found' },
        { status: 404 }
      );
    }

    // Check if this is a detail update (requestorInfo, shippingInfo, notes)
    if (requestorInfo || shippingInfo || notes !== undefined) {
      // Update request details
      const updateData: any = {};
      
      if (requestorInfo) {
        updateData.requestorInfo = requestorInfo;
      }
      
      if (shippingInfo) {
        updateData.shippingInfo = shippingInfo;
      }
      
      if (notes !== undefined) {
        updateData.notes = notes;
      }
      
      // Update the request
      const updatedRequest = await ShoeRequest.findOneAndUpdate(
        { requestId },
        { $set: updateData },
        { new: true }
      );
      
      return NextResponse.json({
        success: true,
        message: 'Request details updated successfully',
        request: updatedRequest
      });
    }

    // If not a detail update, proceed with status update logic
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required for status updates' },
        { status: 400 }
      );
    }

    // Validate status
    if (!Object.values(REQUEST_STATUSES).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Check if status can be changed (rejected requests cannot change)
    if (shoeRequest.currentStatus === ShoeRequestStatus.REJECTED) {
      return NextResponse.json(
        { error: 'Rejected requests cannot change status' },
        { status: 400 }
      );
    }

    // Handle inventory management based on status change
    const oldStatus = shoeRequest.currentStatus;
    const newStatus = status as ShoeRequestStatus;

    // If changing to REJECTED from any other status, restore inventory
    if (newStatus === ShoeRequestStatus.REJECTED && oldStatus !== ShoeRequestStatus.REJECTED) {
      console.log('[INVENTORY] Restoring inventory for rejected request:', requestId);
      
      for (const item of shoeRequest.items) {
        if (item.inventoryId) {
          await Shoe.findByIdAndUpdate(
            item.inventoryId,
            { 
              $inc: { inventoryCount: 1 },    // ✅ Restore inventory count
              $set: { 
                status: 'available',           // ✅ Set status back to available
                lastUpdated: new Date()        // ✅ Update timestamp
              }
            }
          );
          console.log('[INVENTORY] Restored shoe inventory:', item.shoeId || item.inventoryId, 'count +1, status: available');
        }
      }
    }

    // If changing from REJECTED (shouldn't happen but just in case), set back to requested
    if (oldStatus === ShoeRequestStatus.REJECTED && newStatus !== ShoeRequestStatus.REJECTED) {
      console.log('[INVENTORY] Re-allocating inventory for un-rejected request:', requestId);
      
      for (const item of shoeRequest.items) {
        if (item.inventoryId) {
          await Shoe.findByIdAndUpdate(
            item.inventoryId,
            { 
              $inc: { inventoryCount: -1 },   // ✅ Reduce inventory count again
              $set: { 
                status: 'requested',          // ✅ Set status back to requested
                lastUpdated: new Date()       // ✅ Update timestamp
              }
            }
          );
          console.log('[INVENTORY] Re-allocated shoe inventory:', item.shoeId || item.inventoryId, 'count -1, status: requested');
        }
      }
    }

    // Create status history entry
    const statusEntry = {
      status: newStatus,
      timestamp: new Date(),
      note: note || `Status updated to ${newStatus} by admin`
    };

    // Update the request using the model method
    try {
      shoeRequest.addStatusChange(newStatus, statusEntry.note);
      await shoeRequest.save();
    } catch (error) {
      if (error.message === 'Rejected requests cannot change status') {
        return NextResponse.json(
          { error: 'Rejected requests cannot change status' },
          { status: 400 }
        );
      }
      throw error;
    }

    console.log(`[STATUS] Updated request ${requestId} from ${oldStatus} to ${newStatus}`);

    // Send email notification to user if status is significant
    if (newStatus === ShoeRequestStatus.APPROVED || newStatus === ShoeRequestStatus.SHIPPED || newStatus === ShoeRequestStatus.REJECTED) {
      try {
        // Get user details
        const requestorEmail = shoeRequest.requestorInfo.email;
        const requestorName = `${shoeRequest.requestorInfo.firstName} ${shoeRequest.requestorInfo.lastName}`;

        // Get shoe details for email
        const shoeDetails = shoeRequest.items.map(item => 
          `• Shoe ID: ${item.shoeId || 'N/A'} - ${item.brand || 'Unknown Brand'} ${item.name || 'Unknown Model'} (${item.sport || 'General'}, Size ${item.size || 'Unknown'})`
        ).join('\n');

        const shoeDetailsHtml = shoeRequest.items.map(item => 
          `<li><strong>Shoe ID:</strong> ${item.shoeId || 'N/A'} - ${item.brand || 'Unknown Brand'} ${item.name || 'Unknown Model'} (${item.sport || 'General'}, Size ${item.size || 'Unknown'})</li>`
        ).join('');

        // Determine email content based on status
        let subject = '';
        let content = '';

        switch (newStatus) {
          case ShoeRequestStatus.APPROVED:
            subject = 'Your shoe request has been approved!';
            content = `Hi ${requestorName},\n\nGreat news! Your shoe request (${requestId}) has been approved and will be processed soon.\n\nRequested Items:\n${shoeDetails}\n\nThank you for choosing New Steps Project!`;
            break;
          case ShoeRequestStatus.SHIPPED:
            subject = 'Your shoes have been shipped!';
            content = `Hi ${requestorName},\n\nYour requested shoes have been shipped and should arrive soon.\n\nRequest Reference: ${requestId}\n\nShipped Items:\n${shoeDetails}\n\nThank you for choosing New Steps Project!`;
            break;
          case ShoeRequestStatus.REJECTED:
            subject = 'Update on your shoe request';
            content = `Hi ${requestorName},\n\nWe regret to inform you that your shoe request could not be fulfilled at this time.\n\nRequest Reference: ${requestId}\n\nRequested Items:\n${shoeDetails}\n\nReason: ${note || 'Please feel free to browse our inventory for other available options.'}\n\nThank you for your understanding.`;
            break;
        }

        if (subject && content) {
          const htmlContent = content
            .replace(/\n/g, '<br>')
            .replace(/Requested Items:<br>([^<]*)<br>/g, `<br><strong>Requested Items:</strong><br><ul>${shoeDetailsHtml}</ul><br>`)
            .replace(/Shipped Items:<br>([^<]*)<br>/g, `<br><strong>Shipped Items:</strong><br><ul>${shoeDetailsHtml}</ul><br>`);

          await sendCustomEmail(requestorEmail, subject, htmlContent);
          console.log(`[EMAIL] Sent ${newStatus} notification to ${requestorEmail}`);
        }
      } catch (emailError) {
        console.error('[EMAIL] Failed to send notification:', emailError);
        // Don't fail the status update if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Request status updated successfully',
      request: shoeRequest
    });

  } catch (error) {
    console.error('Error updating shoe request status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update request status', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// Create shoe request (admin only - for manual entries)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is an admin
    const user = session.user as SessionUser;
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }
    
    await ensureDbConnected();
    
    const data = await request.json();
    const { requestorInfo, shippingInfo, items, notes, isOffline, status, createdBy } = data;
    
    // Generate request ID
    const requestId = generateRequestId();
    
    // Check if requester is a registered user
    const existingUser = await User.findOne({ email: requestorInfo.email });
    
    // Process items and update inventory
    const processedItems = [];
    for (const item of items) {
      if (item.shoeId) {
        // Find the shoe by shoeId
        const shoe = await Shoe.findOne({ shoeId: item.shoeId });
        if (!shoe) {
          return NextResponse.json(
            { error: `Shoe with ID ${item.shoeId} not found` },
            { status: 404 }
          );
        }
        
        // Check if shoe is available
        if (shoe.status !== 'available') {
          return NextResponse.json(
            { error: `Shoe with ID ${item.shoeId} is not available (current status: ${shoe.status})` },
            { status: 400 }
          );
        }
        
        // Update shoe status to "requested"
        await Shoe.findByIdAndUpdate(
          shoe._id,
          { 
            $set: { status: 'requested' }
          }
        );
        
        console.log('[INVENTORY] Updated shoe', item.shoeId, 'status to "requested"');
        
        // Add inventoryId to the item
        processedItems.push({
          ...item,
          inventoryId: shoe._id,
          brand: shoe.brand,
          name: shoe.modelName,
          sport: shoe.sport,
          condition: shoe.condition
        });
      } else {
        // If no shoeId, keep the item as is
        processedItems.push(item);
      }
    }
    
    // Create initial status history
    const statusHistory = [{
      status: status || ShoeRequestStatus.SUBMITTED,
      timestamp: new Date(),
      note: 'Request created manually by admin'
    }];
    
    // Create shoe request record
    const shoeRequest = new ShoeRequest({
      requestId,
      requestorInfo,
      shippingInfo,
      items: processedItems,
      notes,
      statusHistory,
      currentStatus: status || ShoeRequestStatus.SUBMITTED,
      isOffline: true, // Mark as offline/manual entry
      createdBy: createdBy || session.user.email,
      userId: existingUser?._id // Link to user if exists
    });
    
    await shoeRequest.save();

    // Send confirmation email if user exists and has valid email
    if (requestorInfo.email && existingUser) {
      try {
        const subject = 'Shoe request confirmation';
        const htmlContent = `Hi ${requestorInfo.firstName},<br><br>Your shoe request (${requestId}) has been recorded.<br><br>Thank you for using New Steps Project!`;
        
        await sendCustomEmail(requestorInfo.email, subject, htmlContent);
        console.log('[EMAIL] Sent manual request confirmation to:', requestorInfo.email);
      } catch (emailError) {
        console.error('[EMAIL] Failed to send confirmation:', emailError);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Shoe request created successfully',
      requestId: shoeRequest.requestId,
      request: shoeRequest
    });
    
  } catch (error) {
    console.error('Error creating shoe request:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create shoe request', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 