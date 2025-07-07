#!/usr/bin/env node

/**
 * PRODUCTION DATABASE RESET SCRIPT
 * WARNING: This will completely wipe all data!
 * Use only for initial production testing
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.production' });

const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DB_NAME || 'newsteps';

// Built-in admin user configuration
const ADMIN_USER = {
  firstName: 'Walter',
  lastName: 'Zhang',
  name: 'Walter Zhang',
  email: 'admin@newsteps.fit',
  password: 'Admin123!',
  phone: '(916) 582-7090',
  role: 'admin',
  emailVerified: true
};

async function resetDatabase() {
  console.log('🚨 PRODUCTION DATABASE RESET SCRIPT');
  console.log('=' .repeat(50));
  
  if (process.env.NODE_ENV !== 'production') {
    console.error('❌ This script should only run in production environment');
    process.exit(1);
  }

  // Safety confirmation
  console.log('⚠️  WARNING: This will DELETE ALL DATA!');
  console.log('📊 Database:', DATABASE_NAME);
  console.log('🔗 URI:', MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));
  
  // In production, require manual confirmation
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const confirmed = await new Promise((resolve) => {
    readline.question('Type "RESET PRODUCTION" to confirm: ', (answer) => {
      readline.close();
      resolve(answer === 'RESET PRODUCTION');
    });
  });

  if (!confirmed) {
    console.log('❌ Reset cancelled');
    process.exit(0);
  }

  try {
    console.log('\n🔄 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(DATABASE_NAME);

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections`);

    // Drop all collections
    console.log('\n🗑️  Dropping all collections...');
    for (const collection of collections) {
      await db.collection(collection.name).drop();
      console.log(`   ✅ Dropped: ${collection.name}`);
    }

    // Create built-in admin user
    console.log('\n👤 Creating built-in admin user...');
    const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 10);
    
    await db.collection('users').insertOne({
      ...ADMIN_USER,
      password: hashedPassword,
      createdAt: new Date(),
      lastLogin: new Date()
    });
    console.log(`✅ Created admin user: ${ADMIN_USER.email}`);

    // Initialize counters for ID generation
    console.log('\n🔢 Initializing ID counters...');
    await db.collection('counters').insertMany([
      { _id: 'shoeId', sequence: 100 }, // Start from 101
      { _id: 'donationId', sequence: 0 },
      { _id: 'requestId', sequence: 0 },
      { _id: 'orderId', sequence: 0 }
    ]);
    console.log('✅ ID counters initialized');

    // Create indexes for performance
    console.log('\n⚡ Creating database indexes...');
    
    // Users indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    
    // Shoes indexes
    await db.collection('shoes').createIndex({ shoeId: 1 }, { unique: true });
    await db.collection('shoes').createIndex({ status: 1 });
    await db.collection('shoes').createIndex({ sport: 1, brand: 1 });
    
    // Donations indexes
    await db.collection('donations').createIndex({ donationId: 1 }, { unique: true });
    await db.collection('donations').createIndex({ status: 1 });
    await db.collection('donations').createIndex({ 'donorInfo.email': 1 });
    
    // Money donations indexes
    await db.collection('moneydonations').createIndex({ donationId: 1 }, { unique: true });
    await db.collection('moneydonations').createIndex({ status: 1 });
    
    // Requests indexes
    await db.collection('shoerequests').createIndex({ requestId: 1 }, { unique: true });
    await db.collection('shoerequests').createIndex({ status: 1 });
    await db.collection('shoerequests').createIndex({ userId: 1 });
    
    console.log('✅ Database indexes created');

    await client.close();

    console.log('\n' + '=' .repeat(50));
    console.log('🎉 DATABASE RESET COMPLETE!');
    console.log('=' .repeat(50));
    console.log('👤 Admin Login Details:');
    console.log(`   Email: ${ADMIN_USER.email}`);
    console.log(`   Password: ${ADMIN_USER.password}`);
    console.log(`   Role: ${ADMIN_USER.role}`);
    console.log('\n🔄 Next Steps:');
    console.log('   1. Restart the application');
    console.log('   2. Test admin login');
    console.log('   3. Run production validation tests');
    console.log('   4. Change admin password via admin console');

  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

// Backup current data before reset (optional)
async function backupBeforeReset() {
  console.log('\n💾 Creating backup before reset...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `./backups/pre-reset-backup-${timestamp}.json`;
  
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DATABASE_NAME);
    
    // Export all data
    const collections = await db.listCollections().toArray();
    const backup = {};
    
    for (const collection of collections) {
      const data = await db.collection(collection.name).find({}).toArray();
      backup[collection.name] = data;
    }
    
    const fs = require('fs');
    if (!fs.existsSync('./backups')) {
      fs.mkdirSync('./backups', { recursive: true });
    }
    
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`✅ Backup saved: ${backupFile}`);
    
    await client.close();
  } catch (error) {
    console.warn('⚠️  Backup failed (continuing with reset):', error.message);
  }
}

// Execute reset
if (require.main === module) {
  (async () => {
    try {
      await backupBeforeReset();
      await resetDatabase();
    } catch (error) {
      console.error('💥 Script failed:', error);
      process.exit(1);
    }
  })();
}

module.exports = { resetDatabase, backupBeforeReset }; 