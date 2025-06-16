import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import UserModel, { UserDocument } from '@/models/user'; 
import { z } from 'zod';
import { sendVerificationEmail } from '@/lib/verification';
import { Types } from 'mongoose';

// Validation schema for user registration
const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string()
  }).optional(),
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

    const { firstName, lastName, email, phone, password, address, schoolName, grade, sports, sportClub } = validation.data;
    
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
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Build the user data
    const userData: any = {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      phone,
      password: hashedPassword,
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