const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

async function migrateDonationStatuses() {
  console.log('🔄 Starting donation status migration (picked_up → received)...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const donationsCollection = db.collection('donations');
    
    // Find all donations with 'picked_up' status
    const donationsToUpdate = await donationsCollection.find({
      status: 'picked_up'
    }).toArray();
    
    console.log(`📊 Found ${donationsToUpdate.length} donations with 'picked_up' status`);
    
    if (donationsToUpdate.length === 0) {
      console.log('✅ No donations need status updates');
      return;
    }
    
    // Update all 'picked_up' statuses to 'received'
    const result = await donationsCollection.updateMany(
      { status: 'picked_up' },
      { 
        $set: { 
          status: 'received',
          lastUpdated: new Date()
        }
      }
    );
    
    // Also update any status history entries that contain 'picked_up'
    const historyResult = await donationsCollection.updateMany(
      { 'statusHistory.status': 'picked_up' },
      {
        $set: {
          'statusHistory.$.status': 'received',
          lastUpdated: new Date()
        }
      }
    );
    
    console.log(`\n✅ Migration completed successfully!`);
    console.log(`   Updated ${result.modifiedCount} donation statuses`);
    console.log(`   Updated ${historyResult.modifiedCount} status history entries`);
    console.log(`   Matched ${result.matchedCount} donations`);
    
    // Verify the migration
    const remainingOldStatuses = await donationsCollection.countDocuments({
      status: 'picked_up'
    });
    
    if (remainingOldStatuses === 0) {
      console.log('✅ Verification passed: No donations with old "picked_up" status remain');
    } else {
      console.log(`⚠️  Warning: ${remainingOldStatuses} donations still have old "picked_up" status`);
    }
    
    // Show final status distribution
    const finalDistribution = await donationsCollection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\n📊 Final donation status distribution:');
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
  migrateDonationStatuses()
    .then(() => {
      console.log('\n🎉 Donation status migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateDonationStatuses }; 