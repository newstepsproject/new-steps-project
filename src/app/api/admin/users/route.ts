import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User, { UserRole } from '@/models/user';
import { SessionUser } from '@/types/user';
import bcrypt from 'bcryptjs';

import { ensureDbConnected } from '@/lib/db-utils';
// GET all users (admin only)
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
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Connect to the database
    await ensureDbConnected();

    // Get query parameters
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const sort = url.searchParams.get('sort') || '-createdAt'; // Default to newest first
    const search = url.searchParams.get('search') || '';

    // Build query
    const query: any = {};
    
    // Add role filter if provided
    if (role && role !== 'all') {
      query.role = role;
    }

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination and sorting
    const users = await User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-password') // Exclude password from results
      .lean();

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);

    return NextResponse.json({
      users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch users', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// PATCH update user (admin only)
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
    const adminUser = session.user as SessionUser;
    if (adminUser.role !== 'admin' && adminUser.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Get request data
    const data = await request.json();
    const { 
      userId, 
      role, 
      firstName, 
      lastName, 
      email, 
      phone, 
      address,
      schoolName,
      grade,
      sports,
      sportClub
    } = data;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Connect to the database
    await ensureDbConnected();

    // Find the user
    const userToUpdate = await User.findById(userId);
    
    if (!userToUpdate) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Prepare update object
    const updateData: any = {};
    
    // Only include fields that are provided
    if (role !== undefined) {
      // Validate role
      if (!Object.values(UserRole).includes(role as UserRole)) {
        return NextResponse.json(
          { error: 'Invalid role value' },
          { status: 400 }
        );
      }
      // Only superadmin can promote/demote to superadmin
      if (role === UserRole.SUPERADMIN && adminUser.role !== UserRole.SUPERADMIN) {
        return NextResponse.json(
          { error: 'Only superadmins can promote users to superadmin role' },
          { status: 403 }
        );
      }
      // Admins can promote/demote to admin or user
      updateData.role = role;
    }
    
    // User information fields
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (firstName || lastName) {
      // Update the name field for backward compatibility
      updateData.name = `${firstName || userToUpdate.firstName || ''} ${lastName || userToUpdate.lastName || ''}`.trim();
    }
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    
    // Additional fields
    if (address !== undefined) updateData.address = address;
    if (schoolName !== undefined) updateData.schoolName = schoolName;
    if (grade !== undefined) updateData.grade = grade;
    if (sports !== undefined) updateData.sports = sports;
    if (sportClub !== undefined) updateData.sportClub = sportClub;
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update user', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// POST - Handle both user updates and emergency admin reset
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { action } = data;
    
    // Handle emergency admin reset (no auth required)
    if (action === 'emergency-admin-reset') {
      const ADMIN_EMAIL = 'admin@newsteps.fit';
      const ADMIN_PASSWORD = 'Admin123!';
      
      console.log('🚨 Emergency admin reset requested...');
      
      // Connect to the database
      await ensureDbConnected();
      
      // Check if admin user exists
      const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
      
      if (existingAdmin) {
        console.log('👤 Admin user exists, updating password...');
        
        // Hash the new password
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
        
        // Update the password directly using findByIdAndUpdate to bypass pre-save hooks
        await User.findByIdAndUpdate(existingAdmin._id, {
          password: hashedPassword,
          emailVerified: true,
          role: 'admin'
        });
        
        console.log('✅ Admin password updated successfully!');
        console.log('   - Email:', ADMIN_EMAIL);
        console.log('   - New Password:', ADMIN_PASSWORD);
        
        return NextResponse.json({
          success: true,
          message: 'Admin password updated successfully',
          admin: {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'admin',
            emailVerified: true
          }
        });
        
      } else {
        console.log('🔨 Admin user does not exist, creating new admin user...');
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
        
        // Create the admin user
        const adminUser = new User({
          firstName: 'Admin',
          lastName: 'User',
          email: ADMIN_EMAIL,
          password: hashedPassword,
          role: 'admin',
          emailVerified: true,
          phone: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'US'
          }
        });
        
        await adminUser.save();
        
        console.log('✅ Admin user created successfully!');
        console.log('   - Email:', ADMIN_EMAIL);
        console.log('   - Password:', ADMIN_PASSWORD);
        
        return NextResponse.json({
          success: true,
          message: 'Admin user created successfully',
          admin: {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'admin',
            emailVerified: true
          }
        });
      }
    }
    
    // Handle regular user updates (requires authentication)
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user is an admin
    const adminUser = session.user as SessionUser;
    if (adminUser.role !== 'admin' && adminUser.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Get request data
    const { 
      userId, 
      role, 
      firstName, 
      lastName, 
      email, 
      phone, 
      address,
      schoolName,
      grade,
      sports,
      sportClub,
      password
    } = data;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Connect to the database
    await ensureDbConnected();

    // Find the user
    const userToUpdate = await User.findById(userId);
    
    if (!userToUpdate) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Prepare update object
    const updateData: any = {};
    
    // Only include fields that are provided
    if (role !== undefined) {
      // Validate role
      if (!Object.values(UserRole).includes(role as UserRole)) {
        return NextResponse.json(
          { error: 'Invalid role value' },
          { status: 400 }
        );
      }
      // Only superadmin can promote/demote to superadmin
      if (role === UserRole.SUPERADMIN && adminUser.role !== UserRole.SUPERADMIN) {
        return NextResponse.json(
          { error: 'Only superadmins can promote users to superadmin role' },
          { status: 403 }
        );
      }
      // Admins can promote/demote to admin or user
      updateData.role = role;
    }
    
    // User information fields
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (firstName || lastName) {
      // Update the name field for backward compatibility
      updateData.name = `${firstName || userToUpdate.firstName || ''} ${lastName || userToUpdate.lastName || ''}`.trim();
    }
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    
    // Additional fields
    if (address !== undefined) updateData.address = address;
    if (schoolName !== undefined) updateData.schoolName = schoolName;
    if (grade !== undefined) updateData.grade = grade;
    if (sports !== undefined) updateData.sports = sports;
    if (sportClub !== undefined) updateData.sportClub = sportClub;
    
    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
    
  } catch (error) {
    console.error('❌ Error in POST /api/admin/users:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 