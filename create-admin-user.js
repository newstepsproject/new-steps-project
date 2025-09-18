#!/usr/bin/env node
/**
 * Create Admin User for Localhost Development
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User model (simplified)
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  emailVerified: { type: Boolean, default: false },
  phone: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  console.log('🔧 CREATING ADMIN USER FOR LOCALHOST');
  console.log('====================================');
  
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://newstepsfit:pAGHNe3%21BKCLdt6@dev-newsteps.mitvzgd.mongodb.net/newsteps-dev?retryWrites=true&w=majority&appName=dev-newsteps';
    
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'newstepsfit@gmail.com' });
    
    if (existingAdmin) {
      console.log('\n👑 Admin user already exists!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Created: ${existingAdmin.createdAt}`);
      
      // Update password to ensure it's correct
      console.log('\n🔄 Updating admin password to ensure it works...');
      existingAdmin.password = 'Admin123!';
      await existingAdmin.save();
      console.log('✅ Admin password updated');
      
    } else {
      console.log('\n👑 Creating new admin user...');
      
      const adminUser = new User({
        firstName: 'Admin',
        lastName: 'User',
        email: 'newstepsfit@gmail.com',
        password: 'Admin123!',
        role: 'admin',
        emailVerified: true,
        phone: '1234567890'
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully!');
    }
    
    console.log('\n🎯 ADMIN LOGIN CREDENTIALS:');
    console.log('   Email: newstepsfit@gmail.com');
    console.log('   Password: Admin123!');
    console.log('   URL: http://localhost:3000/login');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    
    if (error.code === 11000) {
      console.log('ℹ️  Admin user already exists with this email');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Disconnected from MongoDB');
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Run the script
createAdminUser().then(() => {
  console.log('\n✅ Admin user setup complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

