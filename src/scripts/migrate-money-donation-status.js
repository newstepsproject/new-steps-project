const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

async function migrateMoneyDonationStatuses() {
  console.log('🔄 Starting money donation status migration...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const moneyDonationsCollection = db.collection('moneydonations');
    
    // Find all money donations with 'submit' status
    const donationsToUpdate = await moneyDonationsCollection.find({
      status: 'submit'
    }).toArray();
    
    console.log(`📊 Found ${donationsToUpdate.length} money donations with 'submit' status`);
    
    if (donationsToUpdate.length === 0) {
      console.log('✅ No money donations need status updates');
      return;
    }
    
    // Update all 'submit' statuses to 'submitted'
    const result = await moneyDonationsCollection.updateMany(
      { status: 'submit' },
      { 
        $set: { 
          status: 'submitted',
          lastUpdated: new Date()
        }
      }
    );
    
    console.log(`\n✅ Migration completed successfully!`);
    console.log(`   Updated ${result.modifiedCount} money donations`);
    console.log(`   Matched ${result.matchedCount} money donations`);
    
    // Verify the migration
    const remainingOldStatuses = await moneyDonationsCollection.countDocuments({
      status: 'submit'
    });
    
    if (remainingOldStatuses === 0) {
      console.log('✅ Verification passed: No money donations with old "submit" status remain');
    } else {
      console.log(`⚠️  Warning: ${remainingOldStatuses} money donations still have old "submit" status`);
    }
    
    // Show final status distribution
    const finalDistribution = await moneyDonationsCollection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\n📊 Final money donation status distribution:');
    finalDistribution.forEach(({ _id, count }) => {
      console.log(`   ${_id}: ${count} donations`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('📦 Database connection closed');
  }
}

// Run the migration
if (require.main === module) {
  migrateMoneyDonationStatuses()
    .then(() => {
      console.log('\n🎉 Money donation status migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateMoneyDonationStatuses }; 