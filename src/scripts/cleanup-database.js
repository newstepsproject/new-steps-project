const mongoose = require('mongoose');

// MongoDB connection
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }
  
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

async function cleanupDatabase(options = {}) {
  try {
    console.log('🧹 Starting database cleanup...');
    
    // Connect to database
    await connectToDatabase();
    
    const {
      preserveAdmin = false,
      preserveSettings = true,
      preserveInventory = false,
      adminEmail = 'admin@newsteps.fit'
    } = options;

    // Get database collections
    const db = mongoose.connection.db;
    
    // Define collections to clean
    const collectionsToClean = [
      { name: 'users', condition: preserveAdmin ? { email: { $ne: adminEmail } } : {} },
      { name: 'volunteers', condition: {} },
      { name: 'donations', condition: {} },
      { name: 'moneydonations', condition: {} },
      { name: 'shoerequests', condition: {} },
      { name: 'orders', condition: {} },
      { name: 'operators', condition: {} },
      { name: 'verificationtokens', condition: {} },
      { name: 'passwordresettokens', condition: {} },
      { name: 'counters', condition: {} }
    ];

    // Add shoes collection only if not preserving inventory
    if (!preserveInventory) {
      collectionsToClean.push({ name: 'shoes', condition: {} });
    }

    // Only clean settings if explicitly requested  
    if (!preserveSettings) {
      collectionsToClean.push({ name: 'settings', condition: {} });
    }

    // Clean each collection
    for (const collection of collectionsToClean) {
      try {
        const result = await db.collection(collection.name).deleteMany(collection.condition);
        console.log(`✅ Cleaned ${collection.name}: ${result.deletedCount} documents deleted`);
      } catch (error) {
        console.error(`❌ Error cleaning ${collection.name}:`, error);
      }
    }

    console.log('🎉 Database cleanup completed!');
    
    // Log what was preserved
    if (preserveAdmin) {
      console.log(`📝 Preserved admin user: ${adminEmail}`);
    }
    if (preserveSettings) {
      console.log('📝 Preserved settings configuration');
    }
    if (preserveInventory) {
      console.log('📝 Preserved shoe inventory');
    }

  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Main execution
async function main() {
  // Load environment variables from .env.local
  require('dotenv').config({ path: '.env.local' });
  
  const args = process.argv.slice(2);
  const cleanupType = args[0] || 'safe';

  switch (cleanupType) {
    case 'all':
      // Clean everything including admin and settings
      console.log('🔥 Complete database reset - ALL DATA WILL BE DELETED');
      await cleanupDatabase({
        preserveAdmin: false,
        preserveSettings: false,
        preserveInventory: false
      });
      break;
      
    case 'users':
      // Clean only user-related data, keep admin, settings, and inventory
      console.log('👥 Cleaning user data only - preserving admin, settings, and inventory');
      await cleanupDatabase({
        preserveAdmin: true,
        preserveSettings: true,
        preserveInventory: true
      });
      break;
      
    case 'safe':
    default:
      // Clean user data but preserve admin and settings
      console.log('🛡️ Safe cleanup - preserving admin user and settings');
      await cleanupDatabase({
        preserveAdmin: true,
        preserveSettings: true,
        preserveInventory: false
      });
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = cleanupDatabase; 