import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import User, { UserRole } from '@/models/user';
import { SessionUser } from '@/types/user';
import { createPasswordResetToken } from '@/lib/password-reset';
import { sendEmail, EmailTemplate } from '@/lib/email';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

import { ensureDbConnected } from '@/lib/db-utils';
// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Define validation schemas
const sendResetEmailSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  action: z.literal('send-email')
});

const setPasswordSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  action: z.literal('set-password'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
});

// POST handler for admin-initiated password reset
export async function POST(request: NextRequest) {
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

    // Connect to the database
    await ensureDbConnected();

    // Parse request body
    const body = await request.json();
    const { action } = body;

    // Handle based on action type
    if (action === 'send-email') {
      const validation = sendResetEmailSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation error', details: validation.error.format() },
          { status: 400 }
        );
      }
      
      return await handleSendResetEmail(validation.data.userId);
    } else if (action === 'set-password') {
      // Only superadmins can directly set passwords
      if (adminUser.role !== 'superadmin') {
        return NextResponse.json(
          { error: 'Only superadmins can directly set user passwords' },
          { status: 403 }
        );
      }
      
      const validation = setPasswordSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation error', details: validation.error.format() },
          { status: 400 }
        );
      }
      
      return await handleSetPassword(validation.data.userId, validation.data.newPassword);
    } else {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Admin password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handler for sending reset email
async function handleSendResetEmail(userId: string) {
  // Find the user
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Create a password reset token
  const token = await createPasswordResetToken(userId);
  
  // Send password reset email
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  
  await sendEmail(
    user.email,
    EmailTemplate.PASSWORD_RESET,
    {
      name: user.name || `${user.firstName} ${user.lastName}`.trim(),
      resetUrl
    }
  );
  
  return NextResponse.json(
    { message: 'Password reset email sent successfully' },
    { status: 200 }
  );
}

// Handler for directly setting a user's password
async function handleSetPassword(userId: string, newPassword: string) {
  // Find the user
  const user = await User.findById(userId);
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  
  // Update the user's password
  user.password = hashedPassword;
  await user.save();
  
  return NextResponse.json(
    { message: 'Password reset successfully' },
    { status: 200 }
  );
} 