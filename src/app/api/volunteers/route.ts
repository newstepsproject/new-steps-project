import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';
import { SessionUser } from '@/types/user';
import { v4 as uuid } from 'uuid';
import Volunteer from '@/models/volunteer';
import { sendVolunteerConfirmation } from '@/lib/email';

// Define the volunteer form data type
type VolunteerFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  availability: string;
  interests: string[];
  skills?: string;
  message?: string;
};

export async function POST(request: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'You must be logged in to submit a volunteer application' },
        { status: 401 }
      );
    }

    // Parse the request body
    const data: VolunteerFormData = await request.json();
    
    // Combine firstName and lastName into full name
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    
    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.phone || !data.city || !data.state || !data.availability || !data.interests || data.interests.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();

    // Find user by ID - add type safety
    const userId = (session.user as SessionUser).id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 400 }
      );
    }
    
    // Generate a unique volunteer ID
    const volunteerId = `VOL-${uuid().substring(0, 8).toUpperCase()}`;
    
    // Create a new volunteer record
    const newVolunteer = new Volunteer({
      volunteerId,
      userId: new mongoose.Types.ObjectId(userId),
      firstName: data.firstName,
      lastName: data.lastName,
      name: fullName,
      email: data.email,
      phone: data.phone,
      city: data.city,
      state: data.state,
      availability: data.availability,
      interests: data.interests,
      skills: data.skills,
      message: data.message,
      submittedAt: new Date(),
      status: 'pending'
    });
    
    // Save the volunteer record
    const savedVolunteer = await newVolunteer.save();
    
    console.log('Volunteer form submitted:', {
      id: savedVolunteer._id,
      volunteerId: savedVolunteer.volunteerId,
      name: savedVolunteer.name,
      email: savedVolunteer.email,
      interests: savedVolunteer.interests,
    });
    
    // Send volunteer confirmation email
    try {
      await sendVolunteerConfirmation({
        to: savedVolunteer.email,
        name: savedVolunteer.name,
        volunteerId: savedVolunteer.volunteerId,
        interests: savedVolunteer.interests,
        availability: savedVolunteer.availability
      });
      console.log('✅ Volunteer confirmation email sent successfully to:', savedVolunteer.email);
    } catch (emailError) {
      console.error('⚠️ Failed to send volunteer confirmation email:', emailError);
      // Don't fail the entire request if email fails - just log the error
    }
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Volunteer application submitted successfully',
        volunteerId: savedVolunteer.volunteerId
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting volunteer form:', error);
    
    return NextResponse.json(
      { success: false, message: 'Failed to submit volunteer application', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also create a test endpoint that doesn't require authentication
export async function PUT(request: NextRequest) {
  try {
    // Parse the request body
    const data: VolunteerFormData = await request.json();
    
    // Combine firstName and lastName into full name
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    
    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.phone || !data.city || !data.state || !data.availability || !data.interests || data.interests.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate a test volunteer ID
    const volunteerId = `TEST-VOL-${uuid().substring(0, 8).toUpperCase()}`;
    
    // Log the data (for testing without connecting to DB)
    console.log('Test volunteer form submitted:', {
      volunteerId,
      firstName: data.firstName,
      lastName: data.lastName,
      name: fullName,
      email: data.email,
      interests: data.interests,
    });
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Volunteer application test submission successful',
        volunteerId,
        testMode: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in test volunteer form:', error);
    
    return NextResponse.json(
      { success: false, message: 'Test submission failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 
