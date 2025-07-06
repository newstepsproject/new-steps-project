import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Donation from '@/models/donation';
import MoneyDonation from '@/models/MoneyDonation';
import ShoeRequest from '@/models/shoeRequest';
import Order from '@/models/order';
import Volunteer from '@/models/volunteer';
import { 
  generateReferenceId, 
  EntityType, 
  validateReferenceId, 
  migrateLegacyReferenceId,
  generateReferenceIdStats 
} from '@/lib/reference-id-generator';

/**
 * Migration script to standardize all reference IDs across the database
 * This ensures consistent reference ID patterns throughout the platform
 */

interface MigrationResult {
  model: string;
  totalRecords: number;
  migratedRecords: number;
  skippedRecords: number;
  errors: string[];
}

async function migrateReferenceIds() {
  console.log('🔄 Starting reference ID migration...');
  
  try {
    await connectDB();
    console.log('✅ Connected to database');
    
    const results: MigrationResult[] = [];
    
    // 1. Migrate Donation reference IDs
    console.log('\n📋 Migrating Donation reference IDs...');
    const donationResult = await migrateDonationIds();
    results.push(donationResult);
    
    // 2. Migrate MoneyDonation reference IDs
    console.log('\n💰 Migrating MoneyDonation reference IDs...');
    const moneyDonationResult = await migrateMoneyDonationIds();
    results.push(moneyDonationResult);
    
    // 3. Migrate ShoeRequest reference IDs
    console.log('\n👟 Migrating ShoeRequest reference IDs...');
    const shoeRequestResult = await migrateShoeRequestIds();
    results.push(shoeRequestResult);
    
    // 4. Migrate Order reference IDs (if any exist)
    console.log('\n📦 Migrating Order reference IDs...');
    const orderResult = await migrateOrderIds();
    results.push(orderResult);
    
    // 5. Migrate Volunteer reference IDs (if any exist)
    console.log('\n🤝 Migrating Volunteer reference IDs...');
    const volunteerResult = await migrateVolunteerIds();
    results.push(volunteerResult);
    
    // Print summary
    console.log('\n📊 Migration Summary:');
    console.log('═'.repeat(60));
    
    let totalRecords = 0;
    let totalMigrated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    
    results.forEach(result => {
      console.log(`\n${result.model}:`);
      console.log(`  Total Records: ${result.totalRecords}`);
      console.log(`  Migrated: ${result.migratedRecords}`);
      console.log(`  Skipped: ${result.skippedRecords}`);
      console.log(`  Errors: ${result.errors.length}`);
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(`    ❌ ${error}`);
        });
      }
      
      totalRecords += result.totalRecords;
      totalMigrated += result.migratedRecords;
      totalSkipped += result.skippedRecords;
      totalErrors += result.errors.length;
    });
    
    console.log('\n' + '═'.repeat(60));
    console.log(`📈 Overall Results:`);
    console.log(`  Total Records Processed: ${totalRecords}`);
    console.log(`  Successfully Migrated: ${totalMigrated}`);
    console.log(`  Skipped (Already Correct): ${totalSkipped}`);
    console.log(`  Errors: ${totalErrors}`);
    
    if (totalErrors === 0) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('⚠️  Migration completed with some errors. Check the logs above.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

/**
 * Migrate donation reference IDs
 */
async function migrateDonationIds(): Promise<MigrationResult> {
  const result: MigrationResult = {
    model: 'Donation',
    totalRecords: 0,
    migratedRecords: 0,
    skippedRecords: 0,
    errors: []
  };
  
  try {
    const donations = await Donation.find({});
    result.totalRecords = donations.length;
    
    for (const donation of donations) {
      try {
        const currentId = donation.donationId;
        
        // Check if already in correct format
        if (validateReferenceId(currentId, EntityType.DONATION)) {
          result.skippedRecords++;
          continue;
        }
        
        // Generate new reference ID
        const newId = generateReferenceId(EntityType.DONATION);
        
        // Update the donation
        await Donation.findByIdAndUpdate(donation._id, {
          donationId: newId,
          // Keep track of the old ID for reference
          oldDonationId: currentId
        });
        
        result.migratedRecords++;
        console.log(`  ✅ ${currentId} → ${newId}`);
        
      } catch (error) {
        const errorMsg = `Failed to migrate donation ${donation._id}: ${error}`;
        result.errors.push(errorMsg);
        console.log(`  ❌ ${errorMsg}`);
      }
    }
    
  } catch (error) {
    result.errors.push(`Failed to fetch donations: ${error}`);
  }
  
  return result;
}

/**
 * Migrate money donation reference IDs
 */
async function migrateMoneyDonationIds(): Promise<MigrationResult> {
  const result: MigrationResult = {
    model: 'MoneyDonation',
    totalRecords: 0,
    migratedRecords: 0,
    skippedRecords: 0,
    errors: []
  };
  
  try {
    const moneyDonations = await MoneyDonation.find({});
    result.totalRecords = moneyDonations.length;
    
    for (const donation of moneyDonations) {
      try {
        const currentId = donation.donationId;
        
        // Check if already in correct format
        if (validateReferenceId(currentId, EntityType.MONEY_DONATION)) {
          result.skippedRecords++;
          continue;
        }
        
        // Generate new reference ID using donor name
        const donorName = donation.firstName && donation.lastName 
          ? `${donation.firstName} ${donation.lastName}`
          : donation.name || 'Anonymous';
        
        const newId = generateReferenceId(EntityType.MONEY_DONATION, { name: donorName });
        
        // Update the money donation
        await MoneyDonation.findByIdAndUpdate(donation._id, {
          donationId: newId,
          // Keep track of the old ID for reference
          oldDonationId: currentId
        });
        
        result.migratedRecords++;
        console.log(`  ✅ ${currentId} → ${newId}`);
        
      } catch (error) {
        const errorMsg = `Failed to migrate money donation ${donation._id}: ${error}`;
        result.errors.push(errorMsg);
        console.log(`  ❌ ${errorMsg}`);
      }
    }
    
  } catch (error) {
    result.errors.push(`Failed to fetch money donations: ${error}`);
  }
  
  return result;
}

/**
 * Migrate shoe request reference IDs
 */
async function migrateShoeRequestIds(): Promise<MigrationResult> {
  const result: MigrationResult = {
    model: 'ShoeRequest',
    totalRecords: 0,
    migratedRecords: 0,
    skippedRecords: 0,
    errors: []
  };
  
  try {
    const shoeRequests = await ShoeRequest.find({});
    result.totalRecords = shoeRequests.length;
    
    for (const request of shoeRequests) {
      try {
        const currentId = request.requestId;
        
        // Check if already in correct format
        if (validateReferenceId(currentId, EntityType.SHOE_REQUEST)) {
          result.skippedRecords++;
          continue;
        }
        
        // Generate new reference ID
        const newId = generateReferenceId(EntityType.SHOE_REQUEST);
        
        // Update the shoe request
        await ShoeRequest.findByIdAndUpdate(request._id, {
          requestId: newId,
          // Keep track of the old ID for reference
          oldRequestId: currentId
        });
        
        result.migratedRecords++;
        console.log(`  ✅ ${currentId} → ${newId}`);
        
      } catch (error) {
        const errorMsg = `Failed to migrate shoe request ${request._id}: ${error}`;
        result.errors.push(errorMsg);
        console.log(`  ❌ ${errorMsg}`);
      }
    }
    
  } catch (error) {
    result.errors.push(`Failed to fetch shoe requests: ${error}`);
  }
  
  return result;
}

/**
 * Migrate order reference IDs
 */
async function migrateOrderIds(): Promise<MigrationResult> {
  const result: MigrationResult = {
    model: 'Order',
    totalRecords: 0,
    migratedRecords: 0,
    skippedRecords: 0,
    errors: []
  };
  
  try {
    const orders = await Order.find({});
    result.totalRecords = orders.length;
    
    for (const order of orders) {
      try {
        const currentId = order.orderId;
        
        // Check if already in correct format
        if (validateReferenceId(currentId, EntityType.ORDER)) {
          result.skippedRecords++;
          continue;
        }
        
        // Generate new reference ID
        const newId = generateReferenceId(EntityType.ORDER);
        
        // Update the order
        await Order.findByIdAndUpdate(order._id, {
          orderId: newId,
          // Keep track of the old ID for reference
          oldOrderId: currentId
        });
        
        result.migratedRecords++;
        console.log(`  ✅ ${currentId} → ${newId}`);
        
      } catch (error) {
        const errorMsg = `Failed to migrate order ${order._id}: ${error}`;
        result.errors.push(errorMsg);
        console.log(`  ❌ ${errorMsg}`);
      }
    }
    
  } catch (error) {
    result.errors.push(`Failed to fetch orders: ${error}`);
  }
  
  return result;
}

/**
 * Migrate volunteer reference IDs
 */
async function migrateVolunteerIds(): Promise<MigrationResult> {
  const result: MigrationResult = {
    model: 'Volunteer',
    totalRecords: 0,
    migratedRecords: 0,
    skippedRecords: 0,
    errors: []
  };
  
  try {
    const volunteers = await Volunteer.find({});
    result.totalRecords = volunteers.length;
    
    for (const volunteer of volunteers) {
      try {
        // Check if volunteer has a reference ID field
        if (!volunteer.volunteerId) {
          // Generate new reference ID
          const newId = generateReferenceId(EntityType.VOLUNTEER);
          
          // Update the volunteer
          await Volunteer.findByIdAndUpdate(volunteer._id, {
            volunteerId: newId
          });
          
          result.migratedRecords++;
          console.log(`  ✅ Added volunteer ID: ${newId}`);
        } else {
          const currentId = volunteer.volunteerId;
          
          // Check if already in correct format
          if (validateReferenceId(currentId, EntityType.VOLUNTEER)) {
            result.skippedRecords++;
            continue;
          }
          
          // Generate new reference ID
          const newId = generateReferenceId(EntityType.VOLUNTEER);
          
          // Update the volunteer
          await Volunteer.findByIdAndUpdate(volunteer._id, {
            volunteerId: newId,
            // Keep track of the old ID for reference
            oldVolunteerId: currentId
          });
          
          result.migratedRecords++;
          console.log(`  ✅ ${currentId} → ${newId}`);
        }
        
      } catch (error) {
        const errorMsg = `Failed to migrate volunteer ${volunteer._id}: ${error}`;
        result.errors.push(errorMsg);
        console.log(`  ❌ ${errorMsg}`);
      }
    }
    
  } catch (error) {
    result.errors.push(`Failed to fetch volunteers: ${error}`);
  }
  
  return result;
}

/**
 * Analyze reference ID patterns in the database
 */
async function analyzeReferenceIds() {
  console.log('🔍 Analyzing reference ID patterns...');
  
  try {
    await connectDB();
    
    // Collect all reference IDs
    const allReferenceIds: string[] = [];
    
    // Get donation IDs
    const donations = await Donation.find({}, 'donationId');
    donations.forEach(d => d.donationId && allReferenceIds.push(d.donationId));
    
    // Get money donation IDs
    const moneyDonations = await MoneyDonation.find({}, 'donationId');
    moneyDonations.forEach(d => d.donationId && allReferenceIds.push(d.donationId));
    
    // Get shoe request IDs
    const shoeRequests = await ShoeRequest.find({}, 'requestId');
    shoeRequests.forEach(r => r.requestId && allReferenceIds.push(r.requestId));
    
    // Get order IDs
    const orders = await Order.find({}, 'orderId');
    orders.forEach(o => o.orderId && allReferenceIds.push(o.orderId));
    
    // Get volunteer IDs
    const volunteers = await Volunteer.find({}, 'volunteerId');
    volunteers.forEach(v => v.volunteerId && allReferenceIds.push(v.volunteerId));
    
    // Generate statistics
    const stats = generateReferenceIdStats(allReferenceIds);
    
    console.log('\n📊 Reference ID Analysis:');
    console.log('═'.repeat(50));
    console.log(`Total Reference IDs: ${stats.totalCount}`);
    console.log(`Valid IDs: ${stats.validCount}`);
    console.log(`Invalid IDs: ${stats.invalidCount}`);
    console.log(`Legacy IDs: ${stats.legacyCount}`);
    console.log('\nBreakdown by Entity Type:');
    
    Object.entries(stats.byEntityType).forEach(([entityType, count]) => {
      console.log(`  ${entityType}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the migration
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'analyze') {
    analyzeReferenceIds();
  } else {
    migrateReferenceIds();
  }
}

export { migrateReferenceIds, analyzeReferenceIds }; 