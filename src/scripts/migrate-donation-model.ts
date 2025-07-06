import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import Donation from '@/models/donation';

/**
 * Migration script to clean up donation model data structure
 * Consolidates duplicate address fields and clarifies online vs offline patterns
 */

async function migrateDonationModel() {
  console.log('🔄 Starting donation model migration...');
  
  try {
    await connectDB();
    console.log('✅ Connected to database');
    
    // Find all donations
    const donations = await Donation.find({});
    console.log(`📊 Found ${donations.length} donations to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const donation of donations) {
      let needsUpdate = false;
      const updates: any = {};
      
      // Check if donation has both donorAddress and donorInfo.address (duplicate)
      if (donation.donorAddress && donation.donorInfo?.address) {
        console.log(`⚠️  Donation ${donation.donationId} has duplicate address fields`);
        // Keep donorInfo.address and remove donorAddress
        updates.$unset = { donorAddress: 1 };
        needsUpdate = true;
      }
      // If donation has donorAddress but no donorInfo.address, move it
      else if (donation.donorAddress && donation.donorInfo && !donation.donorInfo.address) {
        console.log(`🔄 Moving donorAddress to donorInfo.address for ${donation.donationId}`);
        updates['donorInfo.address'] = donation.donorAddress;
        updates.$unset = { donorAddress: 1 };
        needsUpdate = true;
      }
      
      // Validate online vs offline pattern
      if (donation.userId && donation.donorInfo) {
        console.log(`⚠️  Donation ${donation.donationId} has both userId and donorInfo - may indicate inconsistency`);
        
        // If it's marked as offline but has userId, prioritize donorInfo
        if (donation.isOffline) {
          console.log(`   Removing userId for offline donation ${donation.donationId}`);
          updates.$unset = { ...updates.$unset, userId: 1 };
          needsUpdate = true;
        }
        // If it's marked as online but has donorInfo, prioritize userId
        else {
          console.log(`   Removing donorInfo for online donation ${donation.donationId}`);
          updates.$unset = { ...updates.$unset, donorInfo: 1 };
          needsUpdate = true;
        }
      }
      
      // Ensure isOffline flag is set correctly
      if (donation.isOffline === undefined || donation.isOffline === null) {
        // Determine based on presence of userId vs donorInfo
        const shouldBeOffline = !donation.userId && !!donation.donorInfo;
        updates.isOffline = shouldBeOffline;
        needsUpdate = true;
        console.log(`🔄 Setting isOffline=${shouldBeOffline} for ${donation.donationId}`);
      }
      
      if (needsUpdate) {
        await Donation.updateOne({ _id: donation._id }, updates);
        migratedCount++;
        console.log(`✅ Updated donation ${donation.donationId}`);
      } else {
        skippedCount++;
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${migratedCount} donations`);
    console.log(`   ⏭️  Skipped: ${skippedCount} donations (already clean)`);
    console.log(`   📝 Total: ${donations.length} donations processed`);
    
    // Validate the results
    console.log('\n🔍 Validating migration results...');
    
    const onlineDonations = await Donation.countDocuments({ isOffline: false, userId: { $exists: true } });
    const offlineDonations = await Donation.countDocuments({ isOffline: true, donorInfo: { $exists: true } });
    const inconsistentDonations = await Donation.countDocuments({
      $or: [
        { isOffline: false, donorInfo: { $exists: true } },
        { isOffline: true, userId: { $exists: true } },
        { userId: { $exists: true }, donorInfo: { $exists: true } }
      ]
    });
    
    console.log(`   📈 Online donations (userId): ${onlineDonations}`);
    console.log(`   📋 Offline donations (donorInfo): ${offlineDonations}`);
    console.log(`   ⚠️  Inconsistent donations: ${inconsistentDonations}`);
    
    if (inconsistentDonations === 0) {
      console.log('\n🎉 Migration completed successfully! All donations follow the simplified model.');
    } else {
      console.log('\n⚠️  Migration completed with some inconsistencies. Manual review may be needed.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the migration
if (require.main === module) {
  migrateDonationModel()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export default migrateDonationModel; 