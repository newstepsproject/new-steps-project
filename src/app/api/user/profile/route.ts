import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User from '@/models/user';
import { SessionUser } from '@/types/user';
import { z } from 'zod';
import { ValidationPatterns } from '@/lib/validation';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET current user profile
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Get user ID from session
    const userId = (session.user as SessionUser).id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 400 }
      );
    }

    // Fetch user from database
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user data
    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        phone: user.phone,
        address: user.address,
        schoolName: user.schoolName,
        grade: user.grade,
        sports: user.sports,
        sportClub: user.sportClub,
        emailVerified: user.emailVerified,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch user profile', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// Validation schema for profile update
const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  phone: ValidationPatterns.phoneOptional,
  address: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zipCode: z.string().min(1, 'Zip code is required'),
    country: z.string().min(1, 'Country is required')
  }).optional(),
  schoolName: z.string().optional(),
  grade: z.string().optional(),
  sports: z.array(z.string()).optional(),
  sportClub: z.string().optional()
});

// PATCH update user profile
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user ID from session
    const userId = (session.user as SessionUser).id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectToDatabase();

    // Validate request data
    const data = await request.json();
    const validationResult = updateProfileSchema.safeParse(data);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: validationResult.error.format() 
        },
        { status: 400 }
      );
    }

    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Update user fields
    const validatedData = validationResult.data;
    
    if (validatedData.firstName) user.firstName = validatedData.firstName;
    if (validatedData.lastName) user.lastName = validatedData.lastName;
    if (validatedData.firstName || validatedData.lastName) {
      // Update name field for backward compatibility
      user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    if (validatedData.phone) user.phone = validatedData.phone;
    if (validatedData.address) user.address = validatedData.address;
    if (validatedData.schoolName) user.schoolName = validatedData.schoolName;
    if (validatedData.grade) user.grade = validatedData.grade;
    if (validatedData.sports) user.sports = validatedData.sports;
    if (validatedData.sportClub) user.sportClub = validatedData.sportClub;
    
    // Save updated user
    await user.save();
    
    // Return updated user data
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: user.name,
        phone: user.phone,
        address: user.address,
        schoolName: user.schoolName,
        grade: user.grade,
        sports: user.sports,
        sportClub: user.sportClub
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update profile', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 