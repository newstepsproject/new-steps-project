#!/usr/bin/env node

/**
 * Migration Script: firstName/lastName Standardization
 * 
 * This script migrates all existing database records to use firstName/lastName
 * structure instead of single name fields for consistency across the platform.
 * 
 * Models to migrate:
 * - Volunteer: name -> firstName + lastName
 * - MoneyDonation: name -> firstName + lastName  
 * - Donation.donorInfo: name -> firstName + lastName
 * - Operator: name -> firstName + lastName
 * 
 * Usage: npm run migrate:firstname-lastname
 */

import mongoose from 'mongoose';
import connectToDatabase from '../lib/db';
import Volunteer from '../models/volunteer';
import MoneyDonation from '../models/MoneyDonation';
import Donation from '../models/donation';
import Operator from '../models/operator';

// Helper function to split name into firstName and lastName
function splitName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: '', lastName: '' };
  }
  
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  return { firstName, lastName };
}

async function migrateVolunteers() {
  console.log('🔄 Migrating Volunteer records...');
  
  const volunteers = await Volunteer.find({
    $or: [
      { firstName: { $exists: false } },
      { lastName: { $exists: false } },
      { firstName: '' },
      { lastName: '' }
    ]
  });
  
  console.log(`Found ${volunteers.length} volunteer records to migrate`);
  
  for (const volunteer of volunteers) {
    if (volunteer.name && (!volunteer.firstName || !volunteer.lastName)) {
      const { firstName, lastName } = splitName(volunteer.name);
      
      await Volunteer.updateOne(
        { _id: volunteer._id },
        { 
          $set: { 
            firstName, 
            lastName,
            name: volunteer.name // Keep original name for backward compatibility
          } 
        }
      );
      
      console.log(`✅ Updated volunteer: ${volunteer.name} -> ${firstName} ${lastName}`);
    }
  }
  
  console.log('✅ Volunteer migration completed');
}

async function migrateMoneyDonations() {
  console.log('🔄 Migrating MoneyDonation records...');
  
  const donations = await MoneyDonation.find({
    $or: [
      { firstName: { $exists: false } },
      { lastName: { $exists: false } },
      { firstName: '' },
      { lastName: '' }
    ]
  });
  
  console.log(`Found ${donations.length} money donation records to migrate`);
  
  for (const donation of donations) {
    if (donation.name && (!donation.firstName || !donation.lastName)) {
      const { firstName, lastName } = splitName(donation.name);
      
      await MoneyDonation.updateOne(
        { _id: donation._id },
        { 
          $set: { 
            firstName, 
            lastName,
            name: donation.name // Keep original name for backward compatibility
          } 
        }
      );
      
      console.log(`✅ Updated money donation: ${donation.name} -> ${firstName} ${lastName}`);
    }
  }
  
  console.log('✅ MoneyDonation migration completed');
}

async function migrateDonations() {
  console.log('🔄 Migrating Donation.donorInfo records...');
  
  const donations = await Donation.find({
    $or: [
      { 'donorInfo.firstName': { $exists: false } },
      { 'donorInfo.lastName': { $exists: false } },
      { 'donorInfo.firstName': '' },
      { 'donorInfo.lastName': '' }
    ]
  });
  
  console.log(`Found ${donations.length} donation records to migrate`);
  
  for (const donation of donations) {
    if (donation.donorInfo?.name && (!donation.donorInfo.firstName || !donation.donorInfo.lastName)) {
      const { firstName, lastName } = splitName(donation.donorInfo.name);
      
      await Donation.updateOne(
        { _id: donation._id },
        { 
          $set: { 
            'donorInfo.firstName': firstName,
            'donorInfo.lastName': lastName,
            'donorInfo.name': donation.donorInfo.name // Keep original name for backward compatibility
          } 
        }
      );
      
      console.log(`✅ Updated donation: ${donation.donorInfo.name} -> ${firstName} ${lastName}`);
    }
  }
  
  console.log('✅ Donation migration completed');
}

async function migrateOperators() {
  console.log('🔄 Migrating Operator records...');
  
  const operators = await Operator.find({
    $or: [
      { firstName: { $exists: false } },
      { lastName: { $exists: false } },
      { firstName: '' },
      { lastName: '' }
    ]
  });
  
  console.log(`Found ${operators.length} operator records to migrate`);
  
  for (const operator of operators) {
    if (operator.name && (!operator.firstName || !operator.lastName)) {
      const { firstName, lastName } = splitName(operator.name);
      
      await Operator.updateOne(
        { _id: operator._id },
        { 
          $set: { 
            firstName, 
            lastName,
            name: operator.name // Keep original name for backward compatibility
          } 
        }
      );
      
      console.log(`✅ Updated operator: ${operator.name} -> ${firstName} ${lastName}`);
    }
  }
  
  console.log('✅ Operator migration completed');
}

async function runMigration() {
  try {
    console.log('🚀 Starting firstName/lastName migration...');
    
    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to database');
    
    // Run migrations for each model
    await migrateVolunteers();
    await migrateMoneyDonations();
    await migrateDonations();
    await migrateOperators();
    
    console.log('🎉 Migration completed successfully!');
    console.log('');
    console.log('Summary:');
    console.log('- All models now support firstName/lastName structure');
    console.log('- Backward compatibility maintained with name field');
    console.log('- Pre-save hooks ensure data consistency');
    console.log('- Forms and APIs updated to use firstName/lastName');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

export default runMigration; 