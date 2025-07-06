import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Import models
import Shoe from '@/models/shoe';
import Counter from '@/models/counter';

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function analyzeCurrentData() {
  console.log('\n🔍 Analyzing Current Data...');
  
  const totalShoes = await Shoe.countDocuments({});
  const stringIdShoes = await Shoe.countDocuments({ shoeId: { $type: 'string' } });
  const numberIdShoes = await Shoe.countDocuments({ shoeId: { $type: 'number' } });
  
  console.log(`Total shoes: ${totalShoes}`);
  console.log(`String-based IDs: ${stringIdShoes}`);
  console.log(`Number-based IDs: ${numberIdShoes}`);
  
  if (stringIdShoes > 0) {
    console.log('\n📋 String ID shoes that need migration:');
    const shoesToMigrate = await Shoe.find({ shoeId: { $type: 'string' } }).sort({ shoeId: 1 });
    
    for (const shoe of shoesToMigrate) {
      console.log(`   - ID "${shoe.shoeId}" → ${parseInt(String(shoe.shoeId), 10)} (${shoe.brand} ${shoe.modelName})`);
    }
  }
  
  return { totalShoes, stringIdShoes, numberIdShoes };
}

async function migrateStringIdsToNumbers() {
  console.log('\n🔄 Converting String IDs to Numbers...');
  
  // Get all shoes with string IDs, sorted by shoeId
  const shoesToMigrate = await Shoe.find({ shoeId: { $type: 'string' } }).sort({ shoeId: 1 });
  
  if (shoesToMigrate.length === 0) {
    console.log('✅ No shoes need migration - all IDs are already numeric');
    return 0;
  }
  
  let migratedCount = 0;
  
  for (const shoe of shoesToMigrate) {
    try {
      const stringId = String(shoe.shoeId);
      const numericId = parseInt(stringId, 10);
      
      if (isNaN(numericId)) {
        console.error(`❌ Invalid ID: "${stringId}" cannot be converted to number`);
        continue;
      }
      
      // Update the shoe with numeric ID
      await Shoe.updateOne(
        { _id: shoe._id },
        { $set: { shoeId: numericId } }
      );
      
      console.log(`✅ Migrated: "${stringId}" → ${numericId} (${shoe.brand} ${shoe.modelName})`);
      migratedCount++;
      
    } catch (error) {
      console.error(`❌ Failed to migrate shoe ${shoe._id}:`, error);
    }
  }
  
  console.log(`\n✅ Migrated ${migratedCount} shoes from string to numeric IDs`);
  return migratedCount;
}

async function updateCounter() {
  console.log('\n🔄 Updating Counter System...');
  
  try {
    // Find the highest numeric shoe ID
    const highestShoe = await Shoe.findOne(
      { shoeId: { $type: 'number' } },
      {},
      { sort: { shoeId: -1 } }
    );
    
    let newCounterValue = 100; // Default starting point
    
    if (highestShoe && typeof highestShoe.shoeId === 'number') {
      // Set counter to highest ID, so next one will be highest + 1
      newCounterValue = Math.max(highestShoe.shoeId, 100);
      console.log(`Highest existing shoe ID: ${highestShoe.shoeId}`);
    }
    
    // Set the counter to ensure next ID will be at least 101
    if (newCounterValue < 100) {
      newCounterValue = 100;
    }
    
    // Update or create the counter
    await Counter.findByIdAndUpdate(
      'shoeId',
      { $set: { seq: newCounterValue } },
      { upsert: true }
    );
    
    console.log(`✅ Counter updated to: ${newCounterValue} (next ID will be ${newCounterValue + 1})`);
    
    // Test the counter
    const testId = await Counter.getNextSequence('shoeId');
    console.log(`✅ Counter test: next ID is ${testId}`);
    
    // Reset counter back for normal operation (subtract 1 since we just incremented it)
    await Counter.findByIdAndUpdate(
      'shoeId',
      { $set: { seq: newCounterValue } },
      { upsert: true }
    );
    
    return newCounterValue + 1; // Return what the next ID will be
    
  } catch (error) {
    console.error('❌ Failed to update counter:', error);
    return null;
  }
}

async function validateMigration() {
  console.log('\n✅ Validating Migration...');
  
  try {
    // Check that all shoes now have numeric IDs
    const stringIdCount = await Shoe.countDocuments({ shoeId: { $type: 'string' } });
    const numberIdCount = await Shoe.countDocuments({ shoeId: { $type: 'number' } });
    
    console.log(`Final count - String IDs: ${stringIdCount}, Numeric IDs: ${numberIdCount}`);
    
    if (stringIdCount > 0) {
      console.error(`❌ Migration incomplete: ${stringIdCount} shoes still have string IDs`);
      return false;
    }
    
    // Test search functionality
    const firstShoe = await Shoe.findOne({ shoeId: { $type: 'number' } });
    if (firstShoe) {
      const searchResult = await Shoe.findOne({ shoeId: firstShoe.shoeId });
      if (!searchResult) {
        console.error(`❌ Search validation failed: Cannot find shoe by numeric ID ${firstShoe.shoeId}`);
        return false;
      }
      console.log(`✅ Search validation passed: Found shoe ${firstShoe.shoeId} by numeric ID`);
    }
    
    // Test counter functionality
    const nextId = await Counter.getNextSequence('shoeId');
    console.log(`✅ Counter validation: Next ID will be ${nextId}`);
    
    // Reset counter (since we just incremented it during test)
    const currentCounter = await Counter.findById('shoeId');
    if (currentCounter) {
      await Counter.findByIdAndUpdate('shoeId', { $set: { seq: currentCounter.seq - 1 } });
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    return false;
  }
}

async function runMigration() {
  console.log('🚀 Starting Shoe ID Migration to Numbers\n');
  
  await connectDB();
  
  try {
    // Step 1: Analyze current data
    const analysis = await analyzeCurrentData();
    
    if (analysis.stringIdShoes === 0) {
      console.log('\n✅ No migration needed - all shoe IDs are already numeric');
      await updateCounter(); // Still update counter to ensure it starts from proper value
      await validateMigration();
      return;
    }
    
    // Step 2: Migrate string IDs to numbers
    const migratedCount = await migrateStringIdsToNumbers();
    
    // Step 3: Update counter system
    const nextId = await updateCounter();
    
    // Step 4: Validate migration
    const isValid = await validateMigration();
    
    console.log('\n📊 Migration Results:');
    console.log(`✅ Migrated ${migratedCount} shoes from string to numeric IDs`);
    console.log(`✅ Counter updated - next shoe ID will be: ${nextId}`);
    console.log(`✅ Migration ${isValid ? 'SUCCESSFUL' : 'FAILED'}`);
    
    if (isValid) {
      console.log('\n🎉 Shoe ID migration completed successfully!');
      console.log('   - All shoe IDs are now numeric');
      console.log('   - Counter system properly configured');
      console.log('   - Search functionality validated');
      console.log('   - Ready for production use');
    } else {
      console.log('\n❌ Migration failed validation - please review errors above');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run migration
if (require.main === module) {
  runMigration();
}

export { runMigration }; 