#!/usr/bin/env node
/**
 * Setup Development Database - Simple Version
 * Populates the development database with test data
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Simple Shoe schema
const ShoeSchema = new mongoose.Schema({
  shoeId: { type: Number, required: true, unique: true },
  brand: { type: String, required: true },
  modelName: { type: String, required: true },
  gender: { type: String, enum: ['men', 'women', 'unisex'], required: true },
  size: { type: String, required: true },
  color: { type: String, required: true },
  sport: { type: String, required: true },
  condition: { type: String, enum: ['excellent', 'good', 'fair'], required: true },
  description: { type: String },
  inventoryCount: { type: Number, default: 1 },
  status: { type: String, enum: ['available', 'requested', 'shipped', 'unavailable'], default: 'available' },
  images: [{ type: String }]
});

// Simple User schema
const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  emailVerified: { type: Boolean, default: false }
});

const Shoe = mongoose.model('Shoe', ShoeSchema);
const User = mongoose.model('User', UserSchema);

async function setupDevDatabase() {
  console.log('🔧 SETTING UP DEVELOPMENT DATABASE');
  console.log('=====================================');
  
  try {
    // Connect to development database
    console.log('📡 Connecting to development database...');
    await mongoose.connect(process.env.MONGODB_URI);
    const dbName = process.env.MONGODB_URI.split('/')[3].split('?')[0];
    console.log(`✅ Connected to database: ${dbName}`);
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Shoe.deleteMany({});
    await User.deleteMany({});
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Admin123!', 12);
    
    await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@newsteps.fit',
      password: hashedPassword,
      role: 'admin',
      emailVerified: true
    });
    
    // Create test user (you)
    console.log('👤 Creating test user...');
    await User.create({
      firstName: 'Xinwen',
      lastName: 'Zhang',
      email: 'xinwenzhang@gmail.com',
      role: 'user',
      emailVerified: true
    });
    
    // Create test shoes
    console.log('👟 Creating test shoes...');
    const testShoes = [
      {
        shoeId: 101,
        brand: 'Nike',
        modelName: 'Air Max 90',
        gender: 'men',
        size: '10',
        color: 'White/Black',
        sport: 'running',
        condition: 'good',
        description: 'Classic Nike Air Max in great condition',
        inventoryCount: 1,
        status: 'available',
        images: ['/images/shoes/placeholder-shoe.jpg']
      },
      {
        shoeId: 102,
        brand: 'Adidas',
        modelName: 'Ultraboost 22',
        gender: 'women',
        size: '8',
        color: 'Black/White',
        sport: 'running',
        condition: 'excellent',
        description: 'Comfortable Adidas running shoes',
        inventoryCount: 1,
        status: 'available',
        images: ['/images/shoes/placeholder-shoe.jpg']
      },
      {
        shoeId: 103,
        brand: 'Converse',
        modelName: 'Chuck Taylor All Star',
        gender: 'unisex',
        size: '9',
        color: 'Red',
        sport: 'casual',
        condition: 'good',
        description: 'Classic Converse sneakers',
        inventoryCount: 1,
        status: 'available',
        images: ['/images/shoes/placeholder-shoe.jpg']
      }
    ];
    
    for (const shoe of testShoes) {
      await Shoe.create(shoe);
      console.log(`   ✅ Created: ${shoe.brand} ${shoe.modelName} (ID: ${shoe.shoeId})`);
    }
    
    console.log('');
    console.log('🎉 DEVELOPMENT DATABASE SETUP COMPLETE!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   👤 Admin user: admin@newsteps.fit / Admin123!');
    console.log('   👤 Test user: xinwenzhang@gmail.com (OAuth)');
    console.log('   👟 Test shoes: 3 shoes available for checkout');
    console.log('');
    console.log('🧪 Ready for testing:');
    console.log('   1. Go to http://localhost:3000/shoes');
    console.log('   2. Add shoes to cart');
    console.log('   3. Test checkout with pickup/shipping');
    console.log('   4. Production database is separate and unaffected');
    console.log('');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from database');
  }
}

// Run setup
setupDevDatabase();

