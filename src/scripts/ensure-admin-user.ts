// Load environment variables
require('dotenv').config();

import { ensureDbConnected } from '../lib/db-utils';
import User from '../models/user';
import bcrypt from 'bcryptjs';

const ADMIN_EMAIL = 'admin@newsteps.fit';
const ADMIN_PASSWORD = 'admin123'; // Default password - should be changed on first login

async function ensureAdminUser() {
  try {
    console.log('🔍 Checking for built-in admin user...');
    
    // Connect to database
    await ensureDbConnected();
    
    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log('✅ Built-in admin user already exists:', ADMIN_EMAIL);
      console.log('   - Role:', existingAdmin.role);
      console.log('   - Email Verified:', existingAdmin.emailVerified);
      return existingAdmin;
    }
    
    console.log('🔨 Creating built-in admin user...');
    
    // Hash the default password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
    
    // Create the admin user
    const adminUser = new User({
      firstName: 'Admin',
      lastName: 'User',
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      emailVerified: true, // Admin user is pre-verified
      phone: '', // Optional for admin
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'US'
      }
    });
    
    await adminUser.save();
    
    console.log('✅ Built-in admin user created successfully!');
    console.log('   - Email:', ADMIN_EMAIL);
    console.log('   - Default Password:', ADMIN_PASSWORD);
    console.log('   - Role: admin');
    console.log('   - Email Verified: true');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');
    
    return adminUser;
    
  } catch (error) {
    console.error('❌ Error ensuring admin user:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  ensureAdminUser()
    .then(() => {
      console.log('✅ Admin user verification complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to ensure admin user:', error);
      process.exit(1);
    });
}

export { ensureAdminUser, ADMIN_EMAIL }; 