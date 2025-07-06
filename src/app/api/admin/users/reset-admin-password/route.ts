import { NextRequest, NextResponse } from 'next/server';
import { ensureDbConnected } from '@/lib/db-utils';
import User from '@/models/user';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'admin@newsteps.fit';
const ADMIN_PASSWORD = 'Admin123!';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Resetting admin password...');
    
    // Connect to database
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
    
  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reset admin password', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 