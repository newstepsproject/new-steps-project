// Load environment variables
require('dotenv').config();

import connectToDatabase from '../lib/db';
import User from '../models/user';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'admin@newsteps.fit';
const ADMIN_PASSWORD = 'Admin123!';

async function resetAdminPassword() {
  try {
    console.log('🔍 Connecting to database...');
    
    // Connect to database
    await connectToDatabase();
    console.log('✅ Database connected successfully');
    
    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log('👤 Admin user exists, updating password...');
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
      
      // Update the password directly
      await User.findByIdAndUpdate(existingAdmin._id, {
        password: hashedPassword,
        emailVerified: true,
        role: 'admin'
      });
      
      console.log('✅ Admin password updated successfully!');
      console.log('   - Email:', ADMIN_EMAIL);
      console.log('   - New Password:', ADMIN_PASSWORD);
      console.log('   - Role: admin');
      console.log('   - Email Verified: true');
      
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
      console.log('   - Role: admin');
      console.log('   - Email Verified: true');
    }
    
    console.log('');
    console.log('🎉 You can now login with:');
    console.log('   Email:', ADMIN_EMAIL);
    console.log('   Password:', ADMIN_PASSWORD);
    
  } catch (error) {
    console.error('❌ Error resetting admin password:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  resetAdminPassword()
    .then(() => {
      console.log('✅ Admin password reset complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to reset admin password:', error);
      process.exit(1);
    });
}

export { resetAdminPassword }; 