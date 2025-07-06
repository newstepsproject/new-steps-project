const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Status mapping from old system to new simplified system
const STATUS_MAPPING = {
  // Keep these as-is
  'available': 'available',
  'requested': 'requested', 
  'shipped': 'shipped',
  'unavailable': 'unavailable',
  
  // Map old statuses to new ones
  'confirmed': 'requested',      // Confirmed requests become "requested"
  'reserved': 'requested',       // Reserved shoes become "requested"
  'ordered': 'requested',        // Ordered shoes become "requested"
  'delivered': 'shipped',        // Delivered shoes become "shipped"
  'pending_inventory': 'available' // Pending inventory becomes "available"
};

async function migrateShoeStatuses() {
  console.log('🔄 Starting shoe status migration...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const shoesCollection = db.collection('shoes');
    
    // Find all shoes that need status updates
    const shoesToUpdate = await shoesCollection.find({
      status: { 
        $in: ['confirmed', 'reserved', 'ordered', 'delivered', 'pending_inventory'] 
      }
    }).toArray();
    
    console.log(`📊 Found ${shoesToUpdate.length} shoes that need status updates`);
    
    if (shoesToUpdate.length === 0) {
      console.log('✅ No shoes need status updates');
      return;
    }
    
    // Show breakdown of what will be updated
    const statusBreakdown = {};
    shoesToUpdate.forEach(shoe => {
      const oldStatus = shoe.status;
      const newStatus = STATUS_MAPPING[oldStatus];
      if (!statusBreakdown[oldStatus]) {
        statusBreakdown[oldStatus] = { count: 0, newStatus };
      }
      statusBreakdown[oldStatus].count++;
    });
    
    console.log('\n📋 Status migration breakdown:');
    Object.entries(statusBreakdown).forEach(([oldStatus, { count, newStatus }]) => {
      console.log(`   ${oldStatus} → ${newStatus} (${count} shoes)`);
    });
    
    // Perform the bulk update
    const bulkOps = shoesToUpdate.map(shoe => ({
      updateOne: {
        filter: { _id: shoe._id },
        update: { 
          $set: { 
            status: STATUS_MAPPING[shoe.status],
            lastUpdated: new Date()
          }
        }
      }
    }));
    
    const result = await shoesCollection.bulkWrite(bulkOps);
    
    console.log(`\n✅ Migration completed successfully!`);
    console.log(`   Updated ${result.modifiedCount} shoes`);
    console.log(`   Matched ${result.matchedCount} shoes`);
    
    // Verify the migration
    const remainingOldStatuses = await shoesCollection.countDocuments({
      status: { 
        $in: ['confirmed', 'reserved', 'ordered', 'delivered', 'pending_inventory'] 
      }
    });
    
    if (remainingOldStatuses === 0) {
      console.log('✅ Verification passed: No shoes with old statuses remain');
    } else {
      console.log(`⚠️  Warning: ${remainingOldStatuses} shoes still have old statuses`);
    }
    
    // Show final status distribution
    const finalDistribution = await shoesCollection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\n📊 Final status distribution:');
    finalDistribution.forEach(({ _id, count }) => {
      console.log(`   ${_id}: ${count} shoes`);
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
  migrateShoeStatuses()
    .then(() => {
      console.log('\n🎉 Shoe status migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateShoeStatuses, STATUS_MAPPING }; 