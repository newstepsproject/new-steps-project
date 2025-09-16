import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import { ensureDbConnected } from '@/lib/db-utils';
import MoneyDonation from '@/models/MoneyDonation';
import { SessionUser } from '@/types/user';
import User from '@/models/user';
import { sendEmail, sendCustomEmail } from '@/lib/email';
import { generateDonationId, generateMoneyDonationReferenceNumber } from '@/lib/utils';
import { MoneyDonationStatus } from '@/types/common';

// Define valid money donation statuses
const MONEY_DONATION_STATUSES = {
  SUBMITTED: 'submitted',
  RECEIVED: 'received',
  PROCESSED: 'processed',
  CANCELLED: 'cancelled'
};

// GET all money donations (admin only)
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

    // Ensure database connection
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

    // Add search functionality
    if (search) {
      query.$or = [
        { donationId: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination and sorting
    const moneyDonations = await MoneyDonation.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalDonations = await MoneyDonation.countDocuments(query);

    return NextResponse.json({
      donations: moneyDonations,
      pagination: {
        total: totalDonations,
        page,
        limit,
        totalPages: Math.ceil(totalDonations / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching money donations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch money donations', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// Update money donation status
export async function PATCH(request: NextRequest) {
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
    const { donationId, status, notes, checkNumber, donorInfo, amount } = data;
    
    console.log(`[PATCH] Updating money donation ${donationId} to status: ${status}`);
    
    if (!donationId) {
      return NextResponse.json(
        { error: 'Donation ID is required' },
        { status: 400 }
      );
    }
    
    // Validate status
    const validStatuses = ['submitted', 'received', 'processed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Find the donation
    const donation = await MoneyDonation.findOne({ donationId });
    
    if (!donation) {
      return NextResponse.json(
        { error: 'Money donation not found' },
        { status: 404 }
      );
    }
    
    console.log('[PATCH] Found money donation:', donation._id.toString(), 'current status:', donation.status);
    
    // Store the original status for email comparison
    const originalStatus = donation.status;

    // Prepare update data
    const updateData: any = {
      status,
      notes: notes || donation.notes,
      updatedAt: new Date()
    };

    // Add donor info if provided
    if (donorInfo) {
      if (donorInfo.firstName && donorInfo.lastName) {
        updateData.firstName = donorInfo.firstName;
        updateData.lastName = donorInfo.lastName;
        updateData.name = `${donorInfo.firstName} ${donorInfo.lastName}`;
      } else if (donorInfo.name) {
        // Fallback for old format - split into firstName/lastName
        const nameParts = donorInfo.name.split(' ');
        updateData.firstName = nameParts[0] || '';
        updateData.lastName = nameParts.slice(1).join(' ') || '';
        updateData.name = donorInfo.name;
      }
      if (donorInfo.email) updateData.email = donorInfo.email;
      if (donorInfo.phone) updateData.phone = donorInfo.phone;
    }

    // Add amount if provided
    if (amount && !isNaN(amount)) {
      updateData.amount = amount;
    }

    // Add check number if provided
    if (checkNumber) {
      updateData.checkNumber = checkNumber;
    }

    // Add additional fields based on status
    if (status === 'received') {
      updateData.receivedDate = new Date();
    } else if (status === 'processed') {
      // For processed status, ensure receipt information is recorded
      updateData.receiptSent = true;
      updateData.receiptDate = new Date();
    }

    // Update the donation
    console.log('[PATCH] Updating money donation with new status:', status);
    try {
      const updateResult = await MoneyDonation.updateOne(
        { donationId },
        { $set: updateData }
      );
      
      console.log('[PATCH] Update result:', updateResult);
      
      if (updateResult.modifiedCount !== 1) {
        console.log('[PATCH] Warning: Money donation not modified');
      }
      
      // Fetch the updated donation
      const updatedDonation = await MoneyDonation.findOne({ donationId });
      
      if (!updatedDonation) {
        console.log('[PATCH] Error: Could not find money donation after update');
        return NextResponse.json(
          { error: 'Could not find money donation after update' },
          { status: 500 }
        );
      }
      
      console.log('[PATCH] Money donation updated successfully. New status:', updatedDonation.status);
      
      // Send email notification to donor if email exists and status changed
      if (updatedDonation.email && status && originalStatus !== status) {
        try {
          const donorName = updatedDonation.name || `${updatedDonation.firstName} ${updatedDonation.lastName}`.trim();
          let subject = '';
          let content = '';

          switch (status) {
            case 'received':
              subject = 'Your donation has been received - New Steps Project';
              content = `
                <h2>Donation Received</h2>
                <p>Dear ${donorName},</p>
                <p>We have received your generous monetary donation. Thank you for supporting the New Steps Project!</p>
                
                <h3>Donation Details:</h3>
                <p><strong>Donation ID:</strong> ${updatedDonation.donationId}</p>
                <p><strong>Amount:</strong> $${updatedDonation.amount.toFixed(2)}</p>
                ${updatedDonation.checkNumber ? `<p><strong>Check Number:</strong> ${updatedDonation.checkNumber}</p>` : ''}
                <p><strong>Status:</strong> Received</p>
                
                <p>Your donation is now being processed and will help young athletes in need get the sports shoes they require.</p>
                
                <p>Best regards,<br>The New Steps Project Team</p>
              `;
              break;
              
            case 'processed':
              subject = 'Thank you - your donation has been processed - New Steps Project';
              content = `
                <h2>Donation Processed</h2>
                <p>Dear ${donorName},</p>
                <p>Your monetary donation has been successfully processed. Thank you for your generous contribution to the New Steps Project!</p>
                
                <h3>Donation Details:</h3>
                <p><strong>Donation ID:</strong> ${updatedDonation.donationId}</p>
                <p><strong>Amount:</strong> $${updatedDonation.amount.toFixed(2)}</p>
                ${updatedDonation.checkNumber ? `<p><strong>Check Number:</strong> ${updatedDonation.checkNumber}</p>` : ''}
                <p><strong>Status:</strong> Processed</p>
                ${updatedDonation.receiptDate ? `<p><strong>Processed Date:</strong> ${new Date(updatedDonation.receiptDate).toLocaleDateString()}</p>` : ''}
                
                <p>Your donation is now helping young athletes in need get the sports shoes they require. Thank you for making a difference in their lives!</p>
                
                <p>If you need a receipt for tax purposes, please contact us at newstepsfit@gmail.com.</p>
                
                <p>Best regards,<br>The New Steps Project Team</p>
              `;
              break;
              
            case 'cancelled':
              subject = 'Update on your donation - New Steps Project';
              content = `
                <h2>Donation Update</h2>
                <p>Dear ${donorName},</p>
                <p>We regret to inform you that your monetary donation could not be processed at this time.</p>
                
                <h3>Donation Details:</h3>
                <p><strong>Donation ID:</strong> ${updatedDonation.donationId}</p>
                <p><strong>Amount:</strong> $${updatedDonation.amount.toFixed(2)}</p>
                ${updatedDonation.checkNumber ? `<p><strong>Check Number:</strong> ${updatedDonation.checkNumber}</p>` : ''}
                <p><strong>Status:</strong> Cancelled</p>
                
                ${notes ? `<p><strong>Reason:</strong> ${notes}</p>` : ''}
                
                <p>If you have any questions about this update, please feel free to contact us at newstepsfit@gmail.com.</p>
                
                <p>Thank you for your understanding and continued support.</p>
                
                <p>Best regards,<br>The New Steps Project Team</p>
              `;
              break;
          }

          if (subject && content) {
            await sendCustomEmail(updatedDonation.email, subject, content);
            console.log(`[EMAIL] Sent ${status} notification to ${updatedDonation.email} for donation ${donationId}`);
          }
        } catch (emailError) {
          console.error('[EMAIL] Failed to send money donation status notification:', emailError);
          // Don't fail the status update if email fails
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Money donation status updated successfully',
        donation: updatedDonation
      });
    } catch (updateError) {
      console.error('[PATCH] Error updating money donation:', updateError);
      throw updateError;
    }

  } catch (error) {
    console.error('Error updating money donation status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update money donation status', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// Create money donation (admin only - for manual entries)
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
    const { donorInfo, amount, checkNumber, notes, isOffline, status, createdBy } = data;
    
    // Validate status
    const validStatuses = ['submitted', 'received', 'processed', 'cancelled'];
    const donationStatus = status && validStatuses.includes(status) ? status : 'processed';
    
    console.log(`[Admin Money Donation API] Creating donation with status: ${donationStatus}`);
    
    // Generate money donation reference number in the format DM-XXXX-YYYY
    const donorFullName = `${donorInfo.firstName} ${donorInfo.lastName}`;
    let donationId = generateMoneyDonationReferenceNumber(donorFullName);
    
    console.log(`[Admin Money Donation API] Generated reference number: ${donationId} for donor: ${donorFullName}`);
    
    // Check if this reference number already exists
    const existingDonation = await MoneyDonation.findOne({ donationId });
    if (existingDonation) {
      // If it exists, generate a new one with a different random number
      console.log(`[Admin Money Donation API] Reference number collision detected: ${donationId}`);
      const newDonationId = generateMoneyDonationReferenceNumber(donorFullName);
      console.log(`[Admin Money Donation API] Generated new reference number: ${newDonationId}`);
      donationId = newDonationId;
    }
    
    // Check if donor is a registered user (only if email is provided)
    let existingUser = null;
    if (donorInfo?.email) {
      existingUser = await User.findOne({ email: donorInfo.email });
    }
    
    // Prioritize donor info from the form, ensure it's always used for the name
    const donorName = donorFullName; // Combine firstName and lastName
    const donorEmail = donorInfo.email || (existingUser ? existingUser.email : '');
    const donorPhone = donorInfo.phone || (existingUser ? existingUser.phone : '');
    
    // Create donation data with appropriate dates based on status
    const donationData = {
      donationId,
      firstName: donorInfo.firstName,
      lastName: donorInfo.lastName,
      name: donorFullName, // For backward compatibility
      email: donorEmail,
      phone: donorPhone,
      amount,
      checkNumber,
      notes,
      status: donationStatus,
      userId: existingUser?._id, // Link to user if exists
      isOffline: true, // Mark as offline donation
      createdBy: createdBy || session.user.email,
      createdAt: new Date(),
    };
    
    // Add additional fields based on status
    if (donationStatus === 'received' || donationStatus === 'processed') {
      donationData.receivedDate = new Date();
    }
    
    if (donationStatus === 'processed') {
      donationData.receiptSent = true;
      donationData.receiptDate = new Date();
    }
    
    // Create money donation record
    const donation = new MoneyDonation(donationData);
    
    await donation.save();
    
    // Send confirmation email if donor is a registered user and email is provided
    if (existingUser && donorInfo.email) {
      try {
        await sendEmail({
          to: donorInfo.email,
          subject: 'Thank You for Your Donation - New Steps Project',
          html: `
            <h2>Thank You for Your Donation!</h2>
            <p>Dear ${donorFullName},</p>
            <p>We have received your monetary donation. Thank you for supporting the New Steps Project!</p>
            
            <h3>Donation Details:</h3>
            <p><strong>Donation ID:</strong> ${donationId}</p>
            <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
            ${checkNumber ? `<p><strong>Check Number:</strong> ${checkNumber}</p>` : ''}
            <p><strong>Status:</strong> ${donationStatus.charAt(0).toUpperCase() + donationStatus.slice(1)}</p>
            
            <p>Your donation will help young athletes in need get the sports shoes they require. Thank you for making a difference!</p>
            
            <p>Best regards,<br>The New Steps Project Team</p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the request if email fails
      }
    }
    
    return NextResponse.json({
      success: true,
      donation: {
        _id: donation._id,
        donationId: donation.donationId,
        status: donation.status
      }
    });
    
  } catch (error) {
    console.error('Error creating money donation:', error);
    return NextResponse.json(
      { error: 'Failed to create donation' },
      { status: 500 }
    );
  }
} 