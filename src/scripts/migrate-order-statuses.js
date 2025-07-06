const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Status mapping from old system to new simplified system
const STATUS_MAPPING = {
  // Keep these as-is
  'pending': 'pending',
  'shipped': 'shipped',
  'cancelled': 'cancelled',
  
  // Map old statuses to new ones
  'confirmed': 'pending',        // Confirmed orders become "pending" (waiting to be shipped)
  'delivered': 'shipped',        // Delivered orders become "shipped" (final shipping status)
  'requested_return': 'cancelled', // Return requests become "cancelled"
  'return_received': 'cancelled'   // Received returns become "cancelled"
};

async function migrateOrderStatuses() {
  console.log('🔄 Starting order status migration...');
  console.log('📋 Mapping:');
  console.log('   confirmed → pending (waiting to be shipped)');
  console.log('   delivered → shipped (final shipping status)');
  console.log('   requested_return → cancelled (return handled as cancellation)');
  console.log('   return_received → cancelled (return completed as cancellation)');
  console.log('');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const ordersCollection = db.collection('orders');
    
    // Check what orders exist first
    const totalOrders = await ordersCollection.countDocuments();
    console.log(`📊 Found ${totalOrders} total orders in database`);
    
    if (totalOrders === 0) {
      console.log('✅ No orders to migrate');
      return;
    }
    
    // Find all orders that need status updates
    const ordersToUpdate = await ordersCollection.find({
      status: { $in: ['confirmed', 'delivered', 'requested_return', 'return_received'] }
    }).toArray();
    
    console.log(`📊 Found ${ordersToUpdate.length} orders needing status updates`);
    
    if (ordersToUpdate.length === 0) {
      console.log('✅ No orders need status updates');
      return;
    }
    
    // Show current status distribution
    const currentDistribution = await ordersCollection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('📊 Current order status distribution:');
    currentDistribution.forEach(({ _id, count }) => {
      const newStatus = STATUS_MAPPING[_id] || _id;
      const arrow = STATUS_MAPPING[_id] ? ` → ${newStatus}` : '';
      console.log(`   ${_id}: ${count} orders${arrow}`);
    });
    console.log('');
    
    let totalUpdated = 0;
    
    // Update orders one status at a time for better tracking
    for (const [oldStatus, newStatus] of Object.entries(STATUS_MAPPING)) {
      if (oldStatus === newStatus) continue; // Skip statuses that don't change
      
      const result = await ordersCollection.updateMany(
        { status: oldStatus },
        { 
          $set: { 
            status: newStatus,
            lastUpdated: new Date()
          },
          $push: {
            statusHistory: {
              status: newStatus,
              timestamp: new Date(),
              note: `Migrated from '${oldStatus}' to '${newStatus}' during status system simplification`
            }
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${result.modifiedCount} orders from '${oldStatus}' to '${newStatus}'`);
        totalUpdated += result.modifiedCount;
      }
    }
    
    console.log(`\n✅ Migration completed successfully!`);
    console.log(`   Updated ${totalUpdated} order statuses`);
    
    // Verify the migration
    const remainingOldStatuses = await ordersCollection.countDocuments({
      status: { $in: ['confirmed', 'delivered', 'requested_return', 'return_received'] }
    });
    
    if (remainingOldStatuses === 0) {
      console.log('✅ Verification passed: No orders with old statuses remain');
    } else {
      console.log(`⚠️  Warning: ${remainingOldStatuses} orders still have old statuses`);
    }
    
    // Show final status distribution
    const finalDistribution = await ordersCollection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\n📊 Final order status distribution:');
    finalDistribution.forEach(({ _id, count }) => {
      console.log(`   ${_id}: ${count} orders`);
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
  migrateOrderStatuses()
    .then(() => {
      console.log('\n🎉 Order status migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateOrderStatuses }; 