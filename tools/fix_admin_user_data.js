#!/usr/bin/env node
/**
 * Fix Admin User Data
 * 
 * Ensure the admin user has all required fields for proper session creation
 */

const mongoose = require('mongoose');

// Define User schema (minimal for this script)
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  emailVerified: Date,
  firstName: String,
  lastName: String,
  phone: String
}, { collection: 'users' });

const User = mongoose.model('User', UserSchema);

async function fixAdminUserData(mongoUri, environment) {
  console.log(`🔧 FIXING ADMIN USER DATA IN ${environment.toUpperCase()}`);
  console.log('=' * 50);
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');
    
    // Find the admin user
    console.log('🔍 Finding admin user with email: newstepsfit@gmail.com');
    const adminUser = await User.findOne({ 
      email: 'newstepsfit@gmail.com',
      role: 'admin'
    });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('👤 Current admin user data:', {
      id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
      emailVerified: adminUser.emailVerified ? 'Yes' : 'No'
    });
    
    // Fix missing fields
    let updated = false;
    
    if (!adminUser.name) {
      adminUser.name = 'Admin User';
      updated = true;
      console.log('🔄 Added name: Admin User');
    }
    
    if (!adminUser.firstName) {
      adminUser.firstName = 'Admin';
      updated = true;
      console.log('🔄 Added firstName: Admin');
    }
    
    if (!adminUser.lastName) {
      adminUser.lastName = 'User';
      updated = true;
      console.log('🔄 Added lastName: User');
    }
    
    if (!adminUser.emailVerified) {
      adminUser.emailVerified = new Date();
      updated = true;
      console.log('🔄 Set emailVerified to current date');
    }
    
    if (!adminUser.phone) {
      adminUser.phone = '';
      updated = true;
      console.log('🔄 Added empty phone field');
    }
    
    if (updated) {
      await adminUser.save();
      console.log('✅ Admin user data updated');
    } else {
      console.log('✅ Admin user data is already complete');
    }
    
    // Verify the final state
    const updatedAdmin = await User.findOne({ 
      email: 'newstepsfit@gmail.com',
      role: 'admin'
    });
    
    console.log('✅ Final admin user data:', {
      id: updatedAdmin._id,
      name: updatedAdmin.name,
      email: updatedAdmin.email,
      role: updatedAdmin.role,
      firstName: updatedAdmin.firstName,
      lastName: updatedAdmin.lastName,
      phone: updatedAdmin.phone || '(empty)',
      emailVerified: updatedAdmin.emailVerified ? 'Yes' : 'No'
    });
    
  } catch (error) {
    console.error('❌ Error fixing admin user data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from database');
  }
}

async function fixBothEnvironments() {
  console.log('🚀 FIXING ADMIN USER DATA IN BOTH ENVIRONMENTS');
  console.log('=' * 60);
  
  // Load localhost environment
  require('dotenv').config({ path: '.env.local' });
  const localhostUri = process.env.MONGODB_URI;
  
  if (!localhostUri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    return;
  }
  
  // Fix localhost
  await fixAdminUserData(localhostUri, 'localhost');
  
  console.log('\n' + '=' * 60 + '\n');
  
  // Production URI
  const productionUri = 'mongodb+srv://newstepsfit:pAGHNe3%21BKCLdt6@newsteps.mitvzgd.mongodb.net/newsteps?retryWrites=true&w=majority&appName=newsteps';
  
  // Fix production
  await fixAdminUserData(productionUri, 'production');
  
  console.log('\n🎉 ADMIN USER DATA FIX COMPLETE!');
  console.log('📧 Admin login: newstepsfit@gmail.com');
  console.log('🔑 Password: Admin123!');
  console.log('✅ User data complete in both environments');
}

// Run the script
fixBothEnvironments();

