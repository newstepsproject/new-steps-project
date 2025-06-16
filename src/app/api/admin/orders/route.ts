import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Order from '@/models/order';
import { SessionUser } from '@/types/user';
import { ORDER_STATUSES } from '@/types/common';

import { ensureDbConnected } from '@/lib/db-utils';
// GET all orders (admin only)
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
      query.status = status;
    }

    // Add search filter if provided
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'shippingAddress.city': { $regex: search, $options: 'i' } },
        { 'shippingAddress.state': { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination and sorting
    const orders = await Order.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email phone')
      .lean();

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);

    return NextResponse.json({
      orders,
      pagination: {
        total: totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch orders', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// PATCH update order status (admin only)
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

    // Connect to the database
    await ensureDbConnected();

    // Get order ID from URL
    const url = new URL(request.url);
    const orderId = url.pathname.split('/').pop();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get request body
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !Object.values(ORDER_STATUSES).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Find order and update status
    const order = await Order.findOne({ orderId });
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status and add to history
    order.status = status;
    order.statusHistory.unshift({
      status,
      timestamp: new Date(),
      note: `Status updated by admin ${user.name}`
    });

    await order.save();

    return NextResponse.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update order status', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 