import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Shoe from '@/models/shoe';
import ShoeRequest from '@/models/shoeRequest';
import Donation from '@/models/donation';
import User from '@/models/user';
import MoneyDonation from '@/models/MoneyDonation';
import { SessionUser } from '@/types/user';

import { ensureDbConnected } from '@/lib/db-utils';
// Helper function to get the start of month date
function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Helper function to get the start of last month
function getStartOfLastMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

// Helper function to get the end of last month
function getEndOfLastMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59, 999);
}

// Force dynamic rendering due to headers usage
export const dynamic = 'force-dynamic';

// GET analytics data (admin only)
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

    // Get current date
    const now = new Date();
    const startOfMonth = getStartOfMonth(now);
    const startOfLastMonth = getStartOfLastMonth(now);
    const endOfLastMonth = getEndOfLastMonth(now);

    // Shoe Donation metrics
    const totalDonations = await Donation.countDocuments();
    const donationsThisMonth = await Donation.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    const donationsLastMonth = await Donation.countDocuments({ 
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
    });

    // Donation status breakdown
    const donationStatusPipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ];
    const donationStatusBreakdown = await Donation.aggregate(donationStatusPipeline);
    
    // Format donation status breakdown
    const formattedDonationStatus = donationStatusBreakdown.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    // Top brands donated based on tracked inventory
    const topBrandResults = await Shoe.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$brand', 'Unknown'] },
          count: { $sum: { $ifNull: ['$inventoryCount', 1] } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          name: '$_id',
          count: 1,
        },
      },
    ]);

    const topBrands = topBrandResults;

    // Money Donation metrics
    const totalMoneyDonations = await MoneyDonation.countDocuments();
    const moneyDonationsThisMonth = await MoneyDonation.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    const moneyDonationsLastMonth = await MoneyDonation.countDocuments({ 
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
    });
    
    // Calculate total donation amount
    const totalAmountPipeline = [
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }
        }
      }
    ];
    const totalAmountResult = await MoneyDonation.aggregate(totalAmountPipeline);
    const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].totalAmount : 0;
    
    // Money donation status breakdown
    const moneyDonationStatusPipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ];
    const moneyDonationStatusBreakdown = await MoneyDonation.aggregate(moneyDonationStatusPipeline);
    
    // Format money donation status breakdown
    const formattedMoneyDonationStatus = moneyDonationStatusBreakdown.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    // Request metrics
    const totalRequests = await ShoeRequest.countDocuments();
    const requestsThisMonth = await ShoeRequest.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    const requestsLastMonth = await ShoeRequest.countDocuments({ 
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } 
    });

    // Request status breakdown
    const requestStatusResults = await ShoeRequest.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$currentStatus', 'submitted'] },
          count: { $sum: 1 },
        },
      },
    ]);

    const requestStatusBreakdown = requestStatusResults.reduce((acc, curr) => {
      const status = curr._id as string;
      acc[status] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    // Request item aggregation for top sizes and sports
    const topSizesResults = await ShoeRequest.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: { $ifNull: ['$items.size', 'Unspecified'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          size: '$_id',
          count: 1,
        },
      },
    ]);

    const topTypesResults = await ShoeRequest.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: { $ifNull: ['$items.sport', 'Unspecified'] },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $project: {
          _id: 0,
          type: '$_id',
          count: 1,
        },
      },
    ]);

    const topSizes = topSizesResults;
    const topTypes = topTypesResults;

    // User metrics
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    
    // Estimate active users based on recent profile updates
    const activeUsersThisMonth = await User.countDocuments({
      updatedAt: { $gte: startOfMonth },
    });

    // Derive total donated items from donation records (fallback to tracked inventory)
    const donationItemsResult = await Donation.aggregate([
      {
        $group: {
          _id: null,
          totalShoes: { $sum: { $ifNull: ['$numberOfShoes', 0] } },
        },
      },
    ]);

    const trackedInventoryCount = await Shoe.countDocuments();
    const totalShoeItemsDonated = donationItemsResult[0]?.totalShoes || trackedInventoryCount;

    // Return aggregated analytics data
    return NextResponse.json({
      donations: {
        total: totalDonations,
        thisMonth: donationsThisMonth,
        lastMonth: donationsLastMonth,
        statusBreakdown: formattedDonationStatus,
        itemsCount: totalShoeItemsDonated,
        topBrands
      },
      moneyDonations: {
        total: totalMoneyDonations,
        thisMonth: moneyDonationsThisMonth,
        lastMonth: moneyDonationsLastMonth,
        totalAmount: totalAmount,
        statusBreakdown: formattedMoneyDonationStatus
      },
      requests: {
        total: totalRequests,
        thisMonth: requestsThisMonth,
        lastMonth: requestsLastMonth,
        statusBreakdown: requestStatusBreakdown,
        topSizes,
        topTypes
      },
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        activeThisMonth: activeUsersThisMonth
      }
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate analytics', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 
