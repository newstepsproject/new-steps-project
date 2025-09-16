import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Donation from '@/models/donation';
import { DONATION_STATUSES } from '@/constants/config';
import { SessionUser } from '@/types/user';
import User from '@/models/user';
import { sendEmail, sendDonationConfirmationEmail } from '@/lib/email';
import { generateId } from '@/lib/utils';

import { ensureDbConnected } from '@/lib/db-utils';
import Counter from '@/models/counter';
import Shoe from '@/models/shoe';

// GET all donations (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    // Verify user is an admin
    const user = session.user as SessionUser;
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { 
          status: 403,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
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
    const query: any = { donationType: 'shoes' };
    
    // Add status filter if provided
    if (status && status !== 'all') {
      query.status = status;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { 'donorInfo.name': { $regex: search, $options: 'i' } },
        { 'donorInfo.firstName': { $regex: search, $options: 'i' } },
        { 'donorInfo.lastName': { $regex: search, $options: 'i' } },
        { 'donorInfo.email': { $regex: search, $options: 'i' } },
        { donationId: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination and sorting
    const donations = await Donation.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email phone')
      .lean();

    // Transform donations to match frontend expectations
    const transformedDonations = donations.map((donation: any) => {
      // Parse items from donationDescription if possible
      let items = [];
      try {
        // Try to parse the description as JSON first
        const parsed = JSON.parse(donation.donationDescription);
        if (Array.isArray(parsed)) {
          items = parsed;
        } else if (parsed.items && Array.isArray(parsed.items)) {
          items = parsed.items;
        }
      } catch {
        // If not JSON, create a single item from the description
        items = [{
          brand: 'Unknown',
          size: 'Unknown',
          condition: 'Unknown',
          quantity: 1,
          description: donation.donationDescription
        }];
      }

      // Get donor info from all possible sources
      const donorName = (donation.donorInfo?.firstName && donation.donorInfo?.lastName)
                        ? `${donation.donorInfo.firstName} ${donation.donorInfo.lastName}`
                        : donation.donorInfo?.name || 
                          (donation.userId && donation.userId.name) || 
                          'Unknown';
      
      const donorEmail = donation.donorInfo?.email || 
                         (donation.userId && donation.userId.email) || 
                         '';
      
      const donorPhone = donation.donorInfo?.phone || 
                         (donation.userId && donation.userId.phone) || 
                         '';

      // Calculate the number of shoes from the items
      const numberOfShoes = items.reduce((total, item) => total + (item.quantity || 1), 0);

      return {
        _id: donation._id,
        donor: {
          name: donorName,
          email: donorEmail,
          phone: donorPhone
        },
        donorAddress: donation.donorAddress || {
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'USA'
        },
        items: items,
        status: donation.status,
        createdAt: donation.createdAt,
        updatedAt: donation.updatedAt,
        notes: donation.notes,
        isOffline: donation.isOffline || false,
        createdBy: donation.createdBy,
        referenceNumber: donation.donationId,
        isBayArea: donation.isBayArea || false,
        numberOfShoes: donation.numberOfShoes || numberOfShoes
      };
    });

    // Get total count for pagination
    const totalDonations = await Donation.countDocuments(query);

    return NextResponse.json({
      donations: transformedDonations,
      pagination: {
        total: totalDonations,
        page,
        limit,
        totalPages: Math.ceil(totalDonations / limit)
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching donations:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch donations', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// Update donation status
export async function PATCH(request: NextRequest) {
  try {
    console.log('[PATCH] Received request to update donation status');
    
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    console.log('[PATCH] Session:', session ? 'exists' : 'null');
    
    if (!session?.user) {
      console.log('[PATCH] Authentication failed: No session or user');
      return NextResponse.json(
        { error: 'Authentication required' },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    // Verify user is an admin
    const user = session.user as SessionUser;
    console.log('[PATCH] User role:', user.role);
    
    if (user.role !== 'admin') {
      console.log('[PATCH] Authorization failed: User is not an admin');
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { 
          status: 403,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    // Get request data
    const data = await request.json();
    console.log('[PATCH] Request data:', data);
    const { donationId, status, note, donorInfo, items, donorAddress, isBayArea, numberOfShoes } = data;

    if (!donationId) {
      return NextResponse.json(
        { error: 'Donation ID is required' },
        { status: 400 }
      );
    }

    // Validate status against the allowed values if status is being updated
    if (status) {
      const allowedStatuses = [
        DONATION_STATUSES.SUBMITTED,
        DONATION_STATUSES.RECEIVED,
        DONATION_STATUSES.PROCESSED,
        DONATION_STATUSES.CANCELLED
      ];
      
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value. Valid values are: submitted, received, processed, cancelled' },
          { status: 400 }
        );
      }
    }

    // Connect to the database
    await ensureDbConnected();

    // Find the donation - by either donationId field or _id
    console.log('[PATCH] Looking for donation with ID:', donationId);
    let donation;
    
    if (donationId.startsWith('DS-')) {
      // It's a reference number in the donationId field
      donation = await Donation.findOne({ donationId });
    } else {
      // It might be a MongoDB ObjectId in the _id field
      try {
        donation = await Donation.findById(donationId);
      } catch (err) {
        console.error('[PATCH] Invalid ObjectId format:', err);
        // Try one more time with donationId field
        donation = await Donation.findOne({ donationId });
      }
    }
    
    if (!donation) {
      console.log('[PATCH] Donation not found with ID:', donationId);
      return NextResponse.json(
        { error: 'Donation not found' },
        { status: 404 }
      );
    }
    
    console.log('[PATCH] Found donation:', donation._id.toString());

    // Create status history entry if status is changing
    let statusEntry = null;
    if (status && status !== donation.status) {
      statusEntry = {
        status,
        timestamp: new Date(),
        note: note || `Status updated to ${status} by admin`
      };
      console.log('[PATCH] Created status history entry:', statusEntry);
    }

    // Update the donation
    console.log('[PATCH] Updating donation with new data');
    try {
      // First find the donation again to make sure it exists
      const donationToUpdate = await Donation.findOne({ _id: donation._id });
      if (!donationToUpdate) {
        console.log('[PATCH] Donation not found during update');
        return NextResponse.json(
          { error: 'Donation not found during update' },
          { status: 404 }
        );
      }
      
      // Log the current values before update
      console.log('[PATCH] Current donation before update:', {
        status: donationToUpdate.status,
        donorInfo: donationToUpdate.donorInfo
      });
      
      // Prepare update fields
      const updateFields: any = {};
      
      // Update status if provided
      if (status) {
        updateFields.status = status;
      }
      
      // Update notes if provided
      if (data.notes !== undefined) {
        updateFields.notes = data.notes;
      }
      
      // Update donor info if provided
      if (donorInfo) {
        updateFields.donorInfo = {
          firstName: donorInfo.firstName || donationToUpdate.donorInfo?.firstName,
          lastName: donorInfo.lastName || donationToUpdate.donorInfo?.lastName,
          name: donorInfo.name || donationToUpdate.donorInfo?.name,
          email: donorInfo.email || donationToUpdate.donorInfo?.email,
          phone: donorInfo.phone || donationToUpdate.donorInfo?.phone
        };
        
        // Ensure name consistency
        if (donorInfo.firstName && donorInfo.lastName) {
          updateFields.donorInfo.name = `${donorInfo.firstName} ${donorInfo.lastName}`;
        }
      }
      
      // Update donor address if provided
      if (donorAddress) {
        updateFields.donorAddress = {
          street: donorAddress.street || donationToUpdate.donorAddress?.street,
          city: donorAddress.city || donationToUpdate.donorAddress?.city,
          state: donorAddress.state || donationToUpdate.donorAddress?.state,
          zipCode: donorAddress.zipCode || donationToUpdate.donorAddress?.zipCode,
          country: donorAddress.country || donationToUpdate.donorAddress?.country || 'USA'
        };
      }
      
      // Update isBayArea if provided
      if (isBayArea !== undefined) {
        updateFields.isBayArea = isBayArea;
      }
      
      // Update numberOfShoes if provided
      if (numberOfShoes !== undefined) {
        updateFields.numberOfShoes = numberOfShoes;
      }
      
      // Update items if provided
      if (items) {
        // Store the updated items as JSON in the donationDescription field
        updateFields.donationDescription = JSON.stringify(items);
      }
      
      // If updating to processed status, set the processingDate
      if (status === DONATION_STATUSES.PROCESSED && donationToUpdate.status !== DONATION_STATUSES.PROCESSED) {
        updateFields.processingDate = new Date();
      }
      
      // If updating to received status, set the receiveDate
      if (status === DONATION_STATUSES.RECEIVED && donationToUpdate.status !== DONATION_STATUSES.RECEIVED) {
        updateFields.receiveDate = new Date();
      }
      
      // Prepare the update operation
      const updateOperation: any = {
        $set: updateFields
      };
      
      // Add status history entry if status is changing
      if (statusEntry) {
        updateOperation.$push = { statusHistory: statusEntry };
      }
      
      // Update using direct MongoDB operations for better reliability
      const updateResult = await Donation.updateOne(
        { _id: donation._id },
        updateOperation
      );
      
      console.log('[PATCH] Update result:', updateResult);
      
      if (updateResult.modifiedCount !== 1) {
        console.log('[PATCH] Warning: Donation not modified');
      }
      
      // Fetch the updated donation
      const updatedDonation = await Donation.findById(donation._id);
      
      if (!updatedDonation) {
        console.log('[PATCH] Error: Could not find donation after update');
        return NextResponse.json(
          { error: 'Could not find donation after update' },
          { status: 500 }
        );
      }
      
      console.log('[PATCH] Donation updated successfully');
      
      // Send email notification to donor if email exists and status changed
      if (updatedDonation.donorInfo?.email && status && donation.status !== status) {
        try {
          const donorName = updatedDonation.donorInfo.name || 
                           `${updatedDonation.donorInfo.firstName} ${updatedDonation.donorInfo.lastName}`.trim() ||
                           'Donor';
          let subject = '';
          let content = '';

          switch (status) {
            case 'received':
              subject = 'Your shoe donation has been received - New Steps Project';
              content = `
                <h2>Donation Received</h2>
                <p>Dear ${donorName},</p>
                <p>We have received your generous shoe donation. Thank you for supporting the New Steps Project!</p>

                <h3>Donation Details:</h3>
                <p><strong>Donation ID:</strong> ${updatedDonation.donationId}</p>
                <p><strong>Number of Shoes:</strong> ${updatedDonation.numberOfShoes || 'Not specified'}</p>
                <p><strong>Status:</strong> Received</p>

                <p>Your donation is now being processed and will help young athletes in need get the sports shoes they require.</p>

                <p>Best regards,<br>The New Steps Project Team</p>
              `;
              break;

            case 'processed':
              subject = 'Thank you - your shoe donation has been processed - New Steps Project';
              content = `
                <h2>Donation Processed</h2>
                <p>Dear ${donorName},</p>
                <p>Your shoe donation has been successfully processed and added to our inventory. Thank you for your generous contribution to the New Steps Project!</p>

                <h3>Donation Details:</h3>
                <p><strong>Donation ID:</strong> ${updatedDonation.donationId}</p>
                <p><strong>Number of Shoes:</strong> ${updatedDonation.numberOfShoes || 'Not specified'}</p>
                <p><strong>Status:</strong> Processed</p>
                ${updatedDonation.processingDate ? `<p><strong>Processed Date:</strong> ${new Date(updatedDonation.processingDate).toLocaleDateString()}</p>` : ''}

                <p>Your donated shoes are now available to help young athletes in need. Thank you for making a difference in their lives!</p>

                <p>Best regards,<br>The New Steps Project Team</p>
              `;
              break;

            case 'cancelled':
              subject = 'Update on your shoe donation - New Steps Project';
              content = `
                <h2>Donation Update</h2>
                <p>Dear ${donorName},</p>
                <p>We regret to inform you that your shoe donation could not be processed at this time.</p>

                <h3>Donation Details:</h3>
                <p><strong>Donation ID:</strong> ${updatedDonation.donationId}</p>
                <p><strong>Number of Shoes:</strong> ${updatedDonation.numberOfShoes || 'Not specified'}</p>
                <p><strong>Status:</strong> Cancelled</p>

                ${note ? `<p><strong>Reason:</strong> ${note}</p>` : ''}

                <p>If you have any questions about this update, please feel free to contact us at newstepsfit@gmail.com.</p>

                <p>Thank you for your understanding and continued support.</p>

                <p>Best regards,<br>The New Steps Project Team</p>
              `;
              break;
          }

          if (subject && content) {
            const { sendCustomEmail } = await import('@/lib/email');
            await sendCustomEmail(updatedDonation.donorInfo.email, subject, content);
            console.log(`[EMAIL] Sent ${status} notification to ${updatedDonation.donorInfo.email} for donation ${updatedDonation.donationId}`);
          }
        } catch (emailError) {
          console.error('[EMAIL] Failed to send shoe donation status notification:', emailError);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: 'Donation updated successfully',
        donation: updatedDonation
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } catch (updateError) {
      console.error('[PATCH] Error updating donation:', updateError);
      throw updateError;
    }

  } catch (error) {
    console.error('Error updating donation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update donation', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[POST] Received request to add shoe donation');
    
    // Use ensureDbConnected instead of connectToDatabase for more reliable connection
    await ensureDbConnected();
    console.log('[POST] Database connection ensured');
    
    const session = await getServerSession(authOptions);
    console.log('[POST] Session check:', session ? 'Authenticated' : 'Not authenticated');
    
    // Check authentication
    if (!session) {
      console.log('[POST] Error: Unauthorized - No session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let data;
    try {
      data = await request.json();
      console.log('[POST] Received data with shoes count:', data.shoes?.length);
    } catch (parseError) {
      console.error('[POST] Error parsing request JSON:', parseError);
      return NextResponse.json({ error: 'Invalid JSON data', details: String(parseError) }, { status: 400 });
    }
    
    // Validate required fields
    const donorName = data.donorInfo?.firstName && data.donorInfo?.lastName 
      ? `${data.donorInfo.firstName} ${data.donorInfo.lastName}`
      : data.donorInfo?.name;
      
    if (!donorName) {
      console.log('[POST] Error: Donor name is missing');
      return NextResponse.json({ error: 'Donor name is required' }, { status: 400 });
    }
    
    if (!data.shoes || !Array.isArray(data.shoes) || data.shoes.length === 0) {
      console.log('[POST] Error: No shoe items in request');
      return NextResponse.json({ error: 'At least one shoe item is required' }, { status: 400 });
    }
    
    // If this is an online donation (not offline), check for donation reference
    if (data.isOffline === false && !data.donationReference) {
      console.log('[POST] Error: Online donation requires reference number');
      return NextResponse.json({ error: 'Donation reference is required for online donations' }, { status: 400 });
    }
    
    // For online donations, also require email
    if (data.isOffline === false && !data.donorInfo.email) {
      console.log('[POST] Error: Online donation requires donor email');
      return NextResponse.json({ error: 'Donor email is required for online donations' }, { status: 400 });
    }

    // Create the donation record
    console.log('[POST] Generating donation ID');
    
    // If it's an online donation with reference, we'll use that existing donation
    let existingDonation = null;
    let donationId;
    
    if (data.isOffline === false && data.donationReference) {
      // Try to find the existing donation
      existingDonation = await Donation.findOne({ donationId: data.donationReference });
      if (!existingDonation) {
        console.log(`[POST] Error: Could not find donation with reference: ${data.donationReference}`);
        return NextResponse.json({ error: 'Referenced donation not found' }, { status: 404 });
      }
      
      // Check if donation is already processed or cancelled
      if (existingDonation.status === DONATION_STATUSES.PROCESSED) {
        console.log(`[POST] Error: Donation with reference ${data.donationReference} has already been processed`);
        return NextResponse.json({ 
          error: 'This donation has already been processed', 
          status: existingDonation.status 
        }, { status: 400 });
      }
      
      if (existingDonation.status === DONATION_STATUSES.CANCELLED) {
        console.log(`[POST] Error: Donation with reference ${data.donationReference} has been cancelled`);
        return NextResponse.json({ 
          error: 'This donation has been cancelled and cannot be processed', 
          status: existingDonation.status 
        }, { status: 400 });
      }
      
      donationId = existingDonation.donationId;
      console.log(`[POST] Found existing donation with ID: ${donationId}`);
    } else {
      // For offline donations, generate a new donation reference ID using the DS-XXXX-YYYY format
      // Use the same donor name logic as validation - firstName/lastName or name field
      const donorNameForId = data.donorInfo?.firstName && data.donorInfo?.lastName 
        ? `${data.donorInfo.firstName} ${data.donorInfo.lastName}`
        : data.donorInfo?.name || 'DONOR';
      
      // Extract first 4 letters of donor name (uppercase and padded if needed)
      const namePrefix = donorNameForId
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .substring(0, 4)
        .padEnd(4, 'X');
      
      // Generate random 4-digit number
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      
      // Create reference number in required format
      donationId = `DS-${namePrefix}-${randomNum}`;
      
      // Ensure uniqueness
      const existingRef = await Donation.findOne({ donationId });
      if (existingRef) {
        // If duplicate found, try with a different random number
        const newRandomNum = Math.floor(1000 + Math.random() * 9000);
        donationId = `DS-${namePrefix}-${newRandomNum}`;
      }
      
      console.log(`[POST] Generated new donation reference: ${donationId}`);
    }
    
    // Check if donor is a registered user
    let userId = null;
    try {
      if (data.donorInfo?.email) {
        console.log('[POST] Looking up user by email:', data.donorInfo.email);
        const user = await User.findOne({ email: data.donorInfo.email });
        if (user) {
          userId = user._id;
          console.log('[POST] Found registered user:', userId);
        }
      }
    } catch (userLookupError) {
      console.error('[POST] Error looking up user:', userLookupError);
      // Continue without user association
    }
    
    // Calculate total number of shoes in this submission
    const totalShoesInSubmission = data.shoes.reduce((total, shoe) => {
      return total + (parseInt(shoe.quantity) || 1);
    }, 0);
    
    console.log(`[POST] Total shoes in this submission: ${totalShoesInSubmission}`);
    
    // Create donation record (or update existing)
    try {
      console.log('[POST] Creating/updating donation record');
      
      // Create a JSON string representation of all shoe items for storage
      const shoesJson = JSON.stringify(data.shoes.map((shoe: any) => ({
        brand: shoe.brand,
        modelName: shoe.modelName || '',
        gender: shoe.gender,
        size: shoe.size,
        color: shoe.color || 'Not specified',
        sport: shoe.sport,
        condition: shoe.condition,
        quantity: shoe.quantity || 1
      })));
      
      // Create a new donation for offline donations using simplified model
      const donationRecord = {
        donationId,
        donationType: 'shoes',
        // For offline donations, use donorInfo instead of userId
        donorInfo: {
          firstName: data.donorInfo.firstName,
          lastName: data.donorInfo.lastName,
          name: donorName,
          email: data.donorInfo.email || '', // Optional for offline donations
          phone: data.donorInfo.phone || '', // Optional for offline donations
          address: data.donorInfo.address // Include address if provided
        },
        // Store the full shoe data as JSON in the description field
        donationDescription: shoesJson,
        numberOfShoes: totalShoesInSubmission,
        processedShoes: totalShoesInSubmission, // For offline donations, all shoes are processed immediately
        status: DONATION_STATUSES.PROCESSED, // Offline donations are automatically processed
        isOffline: true, // Always true for manually created donations
        notes: data.notes,
        createdBy: data.createdBy || session.user.email,
        donationDate: new Date(),
        statusHistory: [
          {
            status: DONATION_STATUSES.SUBMITTED,
            timestamp: new Date(),
            note: 'Donation submitted'
          },
          {
            status: DONATION_STATUSES.PROCESSED,
            timestamp: new Date(),
            note: 'Donation processed into inventory'
          }
        ]
      };
      
      console.log('[POST] Inserting donation into database using Mongoose model');
      // Use Mongoose model instead of direct db collection access
      const donation = new Donation(donationRecord);
      const savedDonation = await donation.save();
      console.log('[POST] Donation inserted, ID:', savedDonation._id);
      
      // Generate sequential shoe IDs for each shoe
      const shoes = [];
      for (let i = 0; i < data.shoes.length; i++) {
        const shoe = data.shoes[i];
        
        // Generate sequential ID using Counter
        const shoeId = await Counter.getNextSequence('shoeId');
        
        // Create shoe object
        const shoeData = {
          shoeId,
          sku: `${shoe.brand}-${shoe.modelName}-${shoe.size}-${Date.now()}-${i}`,
          brand: shoe.brand,
          modelName: shoe.modelName,
          gender: shoe.gender,
          size: shoe.size,
          color: shoe.color,
          sport: shoe.sport,
          condition: shoe.condition,
          description: shoe.notes,
          features: shoe.features || [],
          images: shoe.images || [],
          status: DONATION_STATUSES.AVAILABLE,
          donationId: savedDonation._id,
          inventoryCount: shoe.quantity || 1,
          inventoryNotes: shoe.inventoryNotes || '',
          dateAdded: new Date(),
          lastUpdated: new Date()
        };

        const savedShoe = await Shoe.create(shoeData);
        shoes.push(savedShoe);
        
        console.log('[POST] Shoe inserted, ID:', savedShoe._id, 'ShoeID:', shoeId);
      }
      
      // Send confirmation email to donor if email provided and they are a registered user
      if (userId && data.donorInfo?.email && data.donorInfo.email !== '') {
        try {
          console.log('[POST] Sending confirmation email to donor:', data.donorInfo.email);
          await sendDonationConfirmationEmail({
            email: data.donorInfo.email,
            name: data.donorInfo.name,
            donationId,
            itemCount: data.shoes.length,
          });
          console.log('[POST] Confirmation email sent successfully');
        } catch (emailError) {
          console.error('[POST] Error sending confirmation email:', emailError);
          // Don't fail the request if email sending fails
        }
      }
      
      console.log('[POST] Request completed successfully');
      return NextResponse.json({ 
        success: true, 
        donation: savedDonation,
        shoes: shoes
      }, { status: 201 });
    } catch (dbError) {
      console.error('[POST] Database error:', dbError);
      return NextResponse.json({ 
        error: 'Database operation failed', 
        details: dbError instanceof Error ? dbError.message : String(dbError) 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('[POST] Unhandled error in shoe donation API:', error);
    return NextResponse.json({ 
      error: 'Failed to create donation', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 