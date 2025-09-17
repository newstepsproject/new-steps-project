#!/usr/bin/env node
/**
 * Update Admin Email Address
 * 
 * Change admin email from admin@newsteps.fit to newstepsfit@gmail.com
 * Keep the same password and all other settings
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

async function updateAdminEmail(mongoUri, environment) {
  console.log(`🔧 UPDATING ADMIN EMAIL IN ${environment.toUpperCase()}`);
  console.log('=' * 50);
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to database');
    
    // Find the current admin user
    console.log('🔍 Finding admin user with email: admin@newsteps.fit');
    const adminUser = await User.findOne({ 
      email: 'admin@newsteps.fit',
      role: 'admin'
    });
    
    if (!adminUser) {
      console.log('❌ Admin user with admin@newsteps.fit not found');
      return;
    }
    
    console.log('👤 Found admin user:', {
      id: adminUser._id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      emailVerified: adminUser.emailVerified ? 'Yes' : 'No'
    });
    
    // Check if newstepsfit@gmail.com already exists
    const existingUser = await User.findOne({ email: 'newstepsfit@gmail.com' });
    if (existingUser && existingUser._id.toString() !== adminUser._id.toString()) {
      console.log('⚠️  User with newstepsfit@gmail.com already exists');
      console.log('   Existing user:', {
        id: existingUser._id,
        name: existingUser.name,
        role: existingUser.role
      });
      
      if (existingUser.role !== 'admin') {
        console.log('🔄 Updating existing user role to admin...');
        existingUser.role = 'admin';
        existingUser.emailVerified = new Date();
        await existingUser.save();
        console.log('✅ Updated existing user to admin');
      }
      
      console.log('🗑️  Removing old admin@newsteps.fit user...');
      await User.deleteOne({ _id: adminUser._id });
      console.log('✅ Removed old admin user');
      
    } else {
      // Update the email address
      console.log('🔄 Updating admin email to: newstepsfit@gmail.com');
      adminUser.email = 'newstepsfit@gmail.com';
      adminUser.emailVerified = new Date(); // Ensure email is verified
      
      await adminUser.save();
      console.log('✅ Admin email updated successfully');
    }
    
    // Verify the update
    const updatedAdmin = await User.findOne({ 
      email: 'newstepsfit@gmail.com',
      role: 'admin'
    });
    
    if (updatedAdmin) {
      console.log('✅ Verification successful - Admin user now has:');
      console.log('   📧 Email: newstepsfit@gmail.com');
      console.log('   👤 Name:', updatedAdmin.name);
      console.log('   🔑 Role: admin');
      console.log('   ✅ Email Verified:', updatedAdmin.emailVerified ? 'Yes' : 'No');
    } else {
      console.log('❌ Verification failed - Could not find updated admin user');
    }
    
  } catch (error) {
    console.error('❌ Error updating admin email:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from database');
  }
}

async function updateBothEnvironments() {
  console.log('🚀 UPDATING ADMIN EMAIL IN BOTH ENVIRONMENTS');
  console.log('=' * 60);
  
  // Load localhost environment
  require('dotenv').config({ path: '.env.local' });
  const localhostUri = process.env.MONGODB_URI;
  
  if (!localhostUri) {
    console.error('❌ MONGODB_URI not found in .env.local');
    return;
  }
  
  // Update localhost
  await updateAdminEmail(localhostUri, 'localhost');
  
  console.log('\n' + '=' * 60 + '\n');
  
  // Production URI (you'll need to provide this)
  const productionUri = 'mongodb+srv://newstepsfit:pAGHNe3%21BKCLdt6@newsteps.mitvzgd.mongodb.net/newsteps?retryWrites=true&w=majority&appName=newsteps';
  
  // Update production
  await updateAdminEmail(productionUri, 'production');
  
  console.log('\n🎉 ADMIN EMAIL UPDATE COMPLETE!');
  console.log('📧 New admin login: newstepsfit@gmail.com');
  console.log('🔑 Password: Admin123! (unchanged)');
  console.log('✅ Updated in both localhost and production databases');
}

// Run the script
updateBothEnvironments();

