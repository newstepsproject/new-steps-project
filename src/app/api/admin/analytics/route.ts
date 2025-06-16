import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
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

    // Top brands donated (mock data for now)
    const topBrands = [
      { name: 'Nike', count: 78 },
      { name: 'Adidas', count: 52 },
      { name: 'New Balance', count: 38 },
      { name: 'Puma', count: 25 },
      { name: 'Other', count: 94 }
    ];

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

    // Request status breakdown (mock data for now)
    const requestStatusBreakdown = {
      pending: 15,
      approved: 22,
      shipped: 31,
      delivered: 18,
      rejected: 12
    };

    // User metrics
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({ 
      createdAt: { $gte: startOfMonth } 
    });
    
    // For active users, we could check last login date, but for now let's mock it
    const activeUsersThisMonth = Math.round(totalUsers * 0.4); // 40% of users as a placeholder

    // Return aggregated analytics data
    return NextResponse.json({
      donations: {
        total: totalDonations,
        thisMonth: donationsThisMonth,
        lastMonth: donationsLastMonth,
        statusBreakdown: formattedDonationStatus,
        itemsCount: totalDonations * 2, // A rough estimate; in a real implementation, we'd count actual items
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
        // Mocked data for now
        topSizes: [
          { size: '9 (Men)', count: 22 },
          { size: '8 (Women)', count: 18 },
          { size: '10 (Men)', count: 15 },
          { size: '7 (Women)', count: 14 },
          { size: 'Other', count: 29 }
        ],
        topTypes: [
          { type: 'Running', count: 41 },
          { type: 'Athletic', count: 24 },
          { type: 'Basketball', count: 17 },
          { type: 'Walking', count: 10 },
          { type: 'Other', count: 6 }
        ]
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