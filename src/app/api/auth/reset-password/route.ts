import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import User from '@/models/user';
import { generateToken } from '@/lib/verification';
import { createPasswordResetToken, verifyPasswordResetToken } from '@/lib/password-reset';
import { z } from 'zod';
import { sendEmail, EmailTemplate } from '@/lib/email';
import bcrypt from 'bcryptjs';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// Request validation schema
const requestSchema = z.object({
  email: z.string().email('Valid email is required')
});

// Reset validation schema
const resetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

// POST handler for requesting password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the input data
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.format() }, 
        { status: 400 }
      );
    }

    const { email } = validation.data;
    
    // Connect to the database
    await connectToDatabase();
    
    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { message: 'Email not found. Please try another email or sign up.', notFound: true },
        { status: 404 }
      );
    }
    
    // Create a password reset token
    const token = await createPasswordResetToken(user._id.toString());
    
    // Send password reset email
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;
    
    await sendEmail(
      user.email,
      EmailTemplate.PASSWORD_RESET,
      {
        name: user.name,
        resetUrl
      }
    );
    
    return NextResponse.json(
      { message: 'Password reset link has been sent to your email.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH handler for resetting password with token
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the input data
    const validation = resetSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.format() }, 
        { status: 400 }
      );
    }

    const { token, password } = validation.data;
    
    // Connect to the database
    await connectToDatabase();
    
    // Verify the token and get the user ID
    const userId = await verifyPasswordResetToken(token);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Invalid or expired token' },
        { status: 400 }
      );
    }
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update the user's password
    user.password = hashedPassword;
    await user.save();
    
    return NextResponse.json(
      { message: 'Password has been reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 