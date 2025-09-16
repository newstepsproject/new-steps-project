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
  skills?: string;
  experience?: string;
  motivation?: string;
};

export async function POST(request: NextRequest) {
  try {
    // Get the current user session (optional for volunteer applications)
    const session = await getServerSession(authOptions);

    // Parse the request body
    const data: VolunteerFormData = await request.json();
    
    // Combine firstName and lastName into full name
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    
    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.phone || !data.city || !data.state || !data.availability) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Connect to the database
    await connectToDatabase();

    // Get user ID if authenticated, otherwise null for anonymous volunteers
    const userId = session?.user ? (session.user as SessionUser).id : null;
    
    // Generate a unique volunteer ID
    const volunteerId = `VOL-${uuid().substring(0, 8).toUpperCase()}`;
    
    // Create a new volunteer record
    const volunteerData: any = {
      volunteerId,
      firstName: data.firstName,
      lastName: data.lastName,
      name: fullName,
      email: data.email,
      phone: data.phone,
      city: data.city,
      state: data.state,
      availability: data.availability,
      interests: ['general'], // Default interest
      skills: data.skills,
      experience: data.experience,
      motivation: data.motivation,
      submittedAt: new Date(),
      status: 'pending'
    };
    
    // Add userId only if user is authenticated
    if (userId) {
      volunteerData.userId = new mongoose.Types.ObjectId(userId);
    }
    
    const newVolunteer = new Volunteer(volunteerData);
    
    // Save the volunteer record
    const savedVolunteer = await newVolunteer.save();
    
    console.log('Volunteer form submitted:', {
      id: savedVolunteer._id,
      volunteerId: savedVolunteer.volunteerId,
      name: savedVolunteer.name,
      email: savedVolunteer.email,
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
