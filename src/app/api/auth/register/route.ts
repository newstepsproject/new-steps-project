import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import UserModel, { UserDocument } from '@/models/user'; 
import { z } from 'zod';
import { sendVerificationEmail } from '@/lib/verification';
import { Types } from 'mongoose';
import { ValidationPatterns } from '@/lib/validation';

// Validation schema for user registration
const registerSchema = z.object({
  firstName: ValidationPatterns.firstName,
  lastName: ValidationPatterns.lastName,
  email: ValidationPatterns.email,
  phone: ValidationPatterns.phoneOptional, // Phone is optional for all registrations
  password: ValidationPatterns.password,
  name: z.string().optional(), // Optional for backward compatibility
  address: ValidationPatterns.addressOptional,
  schoolName: z.string().optional(),
  grade: z.string().optional(),
  sports: z.array(z.string()).optional(),
  sportClub: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the input data
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation error', errors: validation.error.format() }, 
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, password, name, address, schoolName, grade, sports, sportClub } = validation.data;
    
    // Generate full name from firstName and lastName
    const fullName = name || `${firstName} ${lastName}`.trim();
    
    // Connect to the database
    await connectToDatabase();
    
    // Check if the user already exists
    const existingUser = await UserModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 409 }
      );
    }
    
    // Build the user data (password will be hashed by pre-save hook)
    const userData: any = {
      firstName,
      lastName,
      name: fullName,
      email: email.toLowerCase(),
      phone,
      password: password, // Raw password - will be hashed by pre-save hook
      emailVerified: false,
      // Optional fields
      ...(address && { address }),
      ...(schoolName && { schoolName }),
      ...(grade && { grade }),
      ...(sports && { sports }),
      ...(sportClub && { sportClub })
    };
    
    // Create the new user
    const newUser = await UserModel.create(userData);

    // Ensure newUser is properly typed
    if (!(newUser._id instanceof Types.ObjectId)) {
      throw new Error('Invalid user ID type');
    }
    
    // Send verification email
    try {
      await sendVerificationEmail(
        newUser._id.toString(),
        newUser.email,
        newUser.name
      );
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Continue with registration despite email error
    }
    
    // Return success response
    return NextResponse.json(
      { 
        message: 'User registered successfully. Please check your email to verify your account.' 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 