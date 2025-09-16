#!/usr/bin/env node
/**
 * Create Admin User Script
 * Directly creates admin user in database bypassing middleware
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://newstepsfit:pAGHNe3%21BKCLdt6@prod-newsteps.mitvzgd.mongodb.net/newsteps?retryWrites=true&w=majority&appName=prod-newsteps';

const ADMIN_EMAIL = 'admin@newsteps.fit';
const ADMIN_PASSWORD = 'Admin123!';

async function createAdminUser() {
  console.log('🔧 Creating Admin User...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Check if admin user exists
    const existingAdmin = await usersCollection.findOne({ email: ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log('👤 Admin user exists, updating password...');
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
      
      // Update the password
      await usersCollection.updateOne(
        { email: ADMIN_EMAIL },
        {
          $set: {
            password: hashedPassword,
            emailVerified: true,
            role: 'admin'
          }
        }
      );
      
      console.log('✅ Admin password updated successfully!');
      
    } else {
      console.log('🔨 Creating new admin user...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
      
      // Create the admin user
      const adminUser = {
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
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await usersCollection.insertOne(adminUser);
      
      console.log('✅ Admin user created successfully!');
    }
    
    console.log('📋 Admin Credentials:');
    console.log('   - Email:', ADMIN_EMAIL);
    console.log('   - Password:', ADMIN_PASSWORD);
    console.log('   - Role: admin');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createAdminUser().then(() => {
    console.log('\n🎉 Admin user setup complete!');
    console.log('💡 You can now login at: http://localhost:3000/admin');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { createAdminUser };
