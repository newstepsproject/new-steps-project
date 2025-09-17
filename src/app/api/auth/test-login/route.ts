import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User from '@/models/user';

export async function POST(request: NextRequest) {
  try {
    console.log('Test login API called');
    const { email, password } = await request.json();
    console.log('Login attempt for email:', email);
    
    // Connect to database
    await connectToDatabase();
    console.log('Database connected');
    
    // Find user (explicitly select password field since it's excluded by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    console.log('User found:', user ? 'yes' : 'no');
    console.log('User has password:', user ? !!user.password : 'N/A');
    
    if (!user) {
      console.log('User not found');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password
    console.log('Verifying password...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Invalid password');
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    console.log('Login successful for user:', user.email);
    
    // Return user info (for testing purposes)
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role || 'user'
      }
    });
    
  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json(
      { error: 'Login failed', details: error.message },
      { status: 500 }
    );
  }
}
