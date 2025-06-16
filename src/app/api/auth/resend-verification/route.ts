import { NextRequest, NextResponse } from 'next/server';
import { resendVerificationEmail } from '@/lib/verification';
import { z } from 'zod';

// Validation schema for resend request
const resendSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the input data
    const validation = resendSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.format() }, 
        { status: 400 }
      );
    }

    const { email } = validation.data;
    
    // Resend verification email
    const isEmailSent = await resendVerificationEmail(email);

    if (isEmailSent) {
      return NextResponse.json(
        { message: 'Verification email sent successfully' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: 'User not found or already verified' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 