const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.production' });

async function fixShoe1Inventory() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    
    // Connect to MongoDB using production URI
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Get the shoes collection directly
    const shoesCollection = mongoose.connection.db.collection('shoes');
    
    // Find shoe ID 1 current state
    const currentShoe = await shoesCollection.findOne({ shoeId: 1 });
    
    if (!currentShoe) {
      console.log('❌ Shoe ID 1 not found in database');
      return;
    }
    
    console.log('📊 Current shoe ID 1 state:', {
      shoeId: currentShoe.shoeId,
      status: currentShoe.status,
      inventoryCount: currentShoe.inventoryCount,
      brand: currentShoe.brand,
      modelName: currentShoe.modelName
    });
    
    // Fix the inventory if it's 0 and status is available
    if (currentShoe.status === 'available' && currentShoe.inventoryCount === 0) {
      console.log('🔨 Fixing inventory count for shoe ID 1...');
      
      const updateResult = await shoesCollection.updateOne(
        { shoeId: 1 },
        {
          $set: {
            inventoryCount: 1,
            lastUpdated: new Date()
          }
        }
      );
      
      console.log('📝 Update result:', updateResult);
      
      // Verify the fix
      const updatedShoe = await shoesCollection.findOne({ shoeId: 1 });
      console.log('✅ Updated shoe ID 1 state:', {
        shoeId: updatedShoe.shoeId,
        status: updatedShoe.status,
        inventoryCount: updatedShoe.inventoryCount,
        lastUpdated: updatedShoe.lastUpdated
      });
      
      console.log('🎉 SUCCESS: Shoe ID 1 inventory fixed! Count: 0 → 1');
    } else {
      console.log('ℹ️  No fix needed. Current state:', {
        status: currentShoe.status,
        inventoryCount: currentShoe.inventoryCount
      });
    }
    
  } catch (error) {
    console.error('❌ Error fixing shoe inventory:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the fix
fixShoe1Inventory(); 