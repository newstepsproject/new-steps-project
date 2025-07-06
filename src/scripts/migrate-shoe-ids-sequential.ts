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
  
  console.log('\n📋 All shoes in database:');
  const allShoes = await Shoe.find({}).sort({ createdAt: 1 });
  
  for (const shoe of allShoes) {
    console.log(`   - ID "${shoe.shoeId}" (${typeof shoe.shoeId}) - ${shoe.brand} ${shoe.modelName} (Created: ${shoe.createdAt})`);
  }
  
  return { totalShoes, stringIdShoes, numberIdShoes, allShoes };
}

async function reassignAllIdsSequentially() {
  console.log('\n🔄 Reassigning All Shoe IDs Sequentially (101, 102, 103...)...');
  
  // Get all shoes sorted by creation date (oldest first)
  const allShoes = await Shoe.find({}).sort({ createdAt: 1 });
  
  if (allShoes.length === 0) {
    console.log('✅ No shoes found in database');
    return 0;
  }
  
  let currentId = 101; // Start from 101
  let updatedCount = 0;
  
  console.log('\n📝 ID Assignment Plan:');
  for (const shoe of allShoes) {
    console.log(`   - "${shoe.shoeId}" → ${currentId} (${shoe.brand} ${shoe.modelName})`);
    currentId++;
  }
  
  console.log('\n🚀 Executing ID reassignment...');
  currentId = 101; // Reset for actual execution
  
  for (const shoe of allShoes) {
    try {
      const oldId = shoe.shoeId;
      
      // Update the shoe with new sequential ID
      await Shoe.updateOne(
        { _id: shoe._id },
        { $set: { shoeId: currentId } }
      );
      
      console.log(`✅ Updated: "${oldId}" → ${currentId} (${shoe.brand} ${shoe.modelName})`);
      updatedCount++;
      currentId++;
      
    } catch (error) {
      console.error(`❌ Failed to update shoe ${shoe._id}:`, error);
    }
  }
  
  console.log(`\n✅ Reassigned ${updatedCount} shoes with sequential IDs starting from 101`);
  return { updatedCount, nextId: currentId };
}

async function resetCounter(nextId: number) {
  console.log('\n🔄 Resetting Counter System...');
  
  try {
    // Set counter to one less than the next ID we want to assign
    const counterValue = nextId - 1;
    
    // Delete existing counter first to avoid conflicts
    await Counter.deleteOne({ _id: 'shoeId' });
    
    // Create new counter with correct starting value
    await Counter.create({
      _id: 'shoeId',
      seq: counterValue
    });
    
    console.log(`✅ Counter reset to: ${counterValue} (next ID will be ${nextId})`);
    
    // Test the counter
    const testId = await Counter.getNextSequence('shoeId');
    console.log(`✅ Counter test: next ID is ${testId}`);
    
    // Reset counter back for normal operation (subtract 1 since we just incremented it)
    await Counter.findByIdAndUpdate(
      'shoeId',
      { $set: { seq: counterValue } }
    );
    
    return nextId;
    
  } catch (error) {
    console.error('❌ Failed to reset counter:', error);
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
      
      // Show which shoes still have string IDs
      const remainingStringShoes = await Shoe.find({ shoeId: { $type: 'string' } });
      for (const shoe of remainingStringShoes) {
        console.error(`   - Shoe ${shoe._id}: "${shoe.shoeId}" (${shoe.brand} ${shoe.modelName})`);
      }
      return false;
    }
    
    // Check that IDs start from 101
    const lowestShoe = await Shoe.findOne(
      { shoeId: { $type: 'number' } },
      {},
      { sort: { shoeId: 1 } }
    );
    
    if (lowestShoe && lowestShoe.shoeId < 101) {
      console.error(`❌ Lowest shoe ID is ${lowestShoe.shoeId}, should be >= 101`);
      return false;
    }
    
    console.log(`✅ Lowest shoe ID: ${lowestShoe?.shoeId} (should be >= 101)`);
    
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
    
    // Test that all IDs are unique
    const totalShoes = await Shoe.countDocuments({});
    const uniqueIds = await Shoe.distinct('shoeId');
    
    if (totalShoes !== uniqueIds.length) {
      console.error(`❌ Duplicate IDs detected: ${totalShoes} shoes but only ${uniqueIds.length} unique IDs`);
      return false;
    }
    
    console.log(`✅ All ${totalShoes} shoes have unique numeric IDs`);
    
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
  console.log('🚀 Starting Sequential Shoe ID Migration (101+)\n');
  
  await connectDB();
  
  try {
    // Step 1: Analyze current data
    const analysis = await analyzeCurrentData();
    
    // Step 2: Reassign all IDs sequentially starting from 101
    const result = await reassignAllIdsSequentially();
    
    if (result === 0) {
      console.log('\n⚠️  No shoes to migrate');
      return;
    }
    
    const { updatedCount, nextId } = result as { updatedCount: number; nextId: number };
    
    // Step 3: Reset counter system
    const counterNextId = await resetCounter(nextId);
    
    // Step 4: Validate migration
    const isValid = await validateMigration();
    
    console.log('\n📊 Migration Results:');
    console.log(`✅ Reassigned ${updatedCount} shoes with sequential IDs (101+)`);
    console.log(`✅ Counter reset - next shoe ID will be: ${counterNextId}`);
    console.log(`✅ Migration ${isValid ? 'SUCCESSFUL' : 'FAILED'}`);
    
    if (isValid) {
      console.log('\n🎉 Shoe ID migration completed successfully!');
      console.log('   - All shoe IDs are now numeric and sequential (101, 102, 103...)');
      console.log('   - Counter system properly configured');
      console.log('   - Search functionality validated');
      console.log('   - All IDs are unique');
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