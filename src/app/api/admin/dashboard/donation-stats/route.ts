import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import connectToDatabase from '@/lib/db';
import Donation from '@/models/donation';
import { DONATION_STATUSES } from '@/constants/config';
import MoneyDonation from '@/models/MoneyDonation';
import { authOptions } from '@/lib/auth';

import { ensureDbConnected } from '@/lib/db-utils';

// Force dynamic rendering due to headers usage
export const dynamic = 'force-dynamic';

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function GET(request: NextRequest) {
  try {
    console.log('[GET] Receiving request for donation statistics');
    
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    console.log('[GET] Session:', session ? 'exists' : 'null');
    
    if (!session?.user) {
      console.log('[GET] Authentication failed: No session or user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is an admin
    const user = session.user as SessionUser;
    console.log('[GET] User role:', user.role);
    
    if (user.role !== 'admin') {
      console.log('[GET] Authorization failed: User is not an admin');
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Connect to the database
    await ensureDbConnected();
    
    // Get query parameters
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'all';
    
    // Determine date range based on period
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      dateFilter = { createdAt: { $gte: monthAgo } };
    } else if (period === 'year') {
      const yearAgo = new Date();
      yearAgo.setFullYear(now.getFullYear() - 1);
      dateFilter = { createdAt: { $gte: yearAgo } };
    }
    
    // Aggregate donation statistics
    
    // 1. Total donations and count by status
    const statusCounts = await Donation.aggregate([
      { $match: dateFilter },
      { $group: {
        _id: '$status',
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    // 2. Monthly trend for the past 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    
    const monthlyTrend = await Donation.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { 
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // 3. Processing efficiency (average time from submission to processing)
    const processingTimes = await Donation.aggregate([
      { 
        $match: { 
          status: DONATION_STATUSES.PROCESSED,
          ...dateFilter
        } 
      },
      {
        $project: {
          processingTime: {
            $subtract: ['$processingDate', '$donationDate']
          }
        }
      },
      {
        $group: {
          _id: null,
          averageProcessingTime: { $avg: '$processingTime' },
          minProcessingTime: { $min: '$processingTime' },
          maxProcessingTime: { $max: '$processingTime' }
        }
      }
    ]);
    
    // 4. Conversion rate (donations that reached processed status)
    const totalDonations = await Donation.countDocuments(dateFilter);
    const processedDonations = await Donation.countDocuments({
      status: DONATION_STATUSES.PROCESSED,
      ...dateFilter
    });
    const conversionRate = totalDonations ? (processedDonations / totalDonations) * 100 : 0;
    
    // Format the data for the response
    const formattedStatusCounts = {};
    let totalCount = 0;
    
    statusCounts.forEach(item => {
      formattedStatusCounts[item._id] = item.count;
      totalCount += item.count;
    });
    
    // Format monthly trend data for easy charting
    const formattedMonthlyTrend = monthlyTrend.map(item => {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      return {
        month: monthNames[item._id.month - 1],
        year: item._id.year,
        label: `${monthNames[item._id.month - 1].substring(0, 3)} ${item._id.year}`,
        count: item.count
      };
    });
    
    // Format processing time (convert from milliseconds to days)
    const formattedProcessingTime = processingTimes.length > 0 ? {
      average: Math.round(processingTimes[0].averageProcessingTime / (1000 * 60 * 60 * 24) * 10) / 10, // days with 1 decimal
      min: Math.round(processingTimes[0].minProcessingTime / (1000 * 60 * 60 * 24) * 10) / 10,
      max: Math.round(processingTimes[0].maxProcessingTime / (1000 * 60 * 60 * 24) * 10) / 10
    } : {
      average: 0,
      min: 0,
      max: 0
    };
    
    return NextResponse.json({
      total: totalCount,
      byStatus: formattedStatusCounts,
      conversionRate: Math.round(conversionRate * 10) / 10, // rounded to 1 decimal
      monthlyTrend: formattedMonthlyTrend,
      processingTime: formattedProcessingTime,
      period
    });
    
  } catch (error) {
    console.error('Error fetching donation statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch donation statistics' },
      { status: 500 }
    );
  }
} 