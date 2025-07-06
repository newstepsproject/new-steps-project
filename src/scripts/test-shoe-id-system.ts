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

async function testCounterSystem() {
  console.log('\n🔍 Testing Counter System...');
  
  try {
    // Test getting next sequence
    const nextId = await Counter.getNextSequence('shoeId');
    console.log(`✅ Counter.getNextSequence() returned: ${nextId} (type: ${typeof nextId})`);
    
    if (typeof nextId !== 'number') {
      console.error('❌ Counter should return number, got:', typeof nextId);
      return false;
    }
    
    if (nextId < 101) {
      console.error('❌ Counter should start from 101, got:', nextId);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Counter test failed:', error);
    return false;
  }
}

async function testExistingShoes() {
  console.log('\n🔍 Testing Existing Shoes...');
  
  try {
    const shoes = await Shoe.find({}).limit(5);
    console.log(`Found ${shoes.length} existing shoes`);
    
    if (shoes.length === 0) {
      console.log('⚠️  No existing shoes found in database');
      return true;
    }
    
    for (const shoe of shoes) {
      console.log(`- Shoe ID: ${shoe.shoeId} (type: ${typeof shoe.shoeId}) - ${shoe.brand} ${shoe.modelName}`);
      
      if (typeof shoe.shoeId === 'string') {
        console.log(`  ⚠️  String-based ID detected: "${shoe.shoeId}" - needs migration`);
      } else if (typeof shoe.shoeId === 'number') {
        console.log(`  ✅ Numeric ID confirmed: ${shoe.shoeId}`);
      } else {
        console.log(`  ❌ Unexpected ID type: ${typeof shoe.shoeId}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Existing shoes test failed:', error);
    return false;
  }
}

async function testNewShoeCreation() {
  console.log('\n🔍 Testing New Shoe Creation...');
  
  try {
    const testShoe = new Shoe({
      sku: `TEST-SHOE-${Date.now()}`,
      brand: 'Test Brand',
      modelName: 'Test Model',
      gender: 'unisex',
      size: '10',
      color: 'Blue',
      sport: 'testing',
      condition: 'like_new',
      description: 'Test shoe for ID system verification',
      images: ['/images/placeholder-shoe.jpg'],
      status: 'available',
      inventoryCount: 1
    });
    
    console.log('Creating new shoe...');
    const savedShoe = await testShoe.save();
    
    console.log(`✅ New shoe created with ID: ${savedShoe.shoeId} (type: ${typeof savedShoe.shoeId})`);
    console.log(`   MongoDB _id: ${savedShoe._id}`);
    console.log(`   SKU: ${savedShoe.sku}`);
    console.log(`   Brand: ${savedShoe.brand} ${savedShoe.modelName}`);
    
    if (typeof savedShoe.shoeId !== 'number') {
      console.error('❌ New shoe should have numeric ID, got:', typeof savedShoe.shoeId);
      return false;
    }
    
    if (savedShoe.shoeId < 101) {
      console.error('❌ New shoe ID should be >= 101, got:', savedShoe.shoeId);
      return false;
    }
    
    // Test querying by numeric ID
    const foundShoe = await Shoe.findOne({ shoeId: savedShoe.shoeId });
    if (!foundShoe) {
      console.error('❌ Could not find shoe by numeric ID');
      return false;
    }
    
    console.log('✅ Successfully found shoe by numeric ID');
    
    // Clean up test shoe
    await Shoe.deleteOne({ _id: savedShoe._id });
    console.log('🧹 Test shoe cleaned up');
    
    return true;
  } catch (error) {
    console.error('❌ New shoe creation test failed:', error);
    return false;
  }
}

async function testSearchFunctionality() {
  console.log('\n🔍 Testing Search Functionality...');
  
  try {
    // Test numeric search
    const shoes = await Shoe.find({}).limit(3);
    if (shoes.length === 0) {
      console.log('⚠️  No shoes found for search testing');
      return true;
    }
    
    for (const shoe of shoes) {
      if (typeof shoe.shoeId === 'number') {
        // Test exact numeric match
        const numericResults = await Shoe.find({ shoeId: shoe.shoeId });
        console.log(`✅ Numeric search for ID ${shoe.shoeId}: found ${numericResults.length} result(s)`);
        
        if (numericResults.length !== 1) {
          console.error(`❌ Expected 1 result for unique ID ${shoe.shoeId}, got ${numericResults.length}`);
          return false;
        }
      }
    }
    
    // Test text search
    const textResults = await Shoe.find({
      $or: [
        { brand: { $regex: 'Nike', $options: 'i' } },
        { modelName: { $regex: 'Air', $options: 'i' } }
      ]
    });
    console.log(`✅ Text search: found ${textResults.length} result(s)`);
    
    return true;
  } catch (error) {
    console.error('❌ Search functionality test failed:', error);
    return false;
  }
}

async function checkSchemaConsistency() {
  console.log('\n🔍 Checking Schema Consistency...');
  
  try {
    const shoeSchema = Shoe.schema.paths.shoeId;
    console.log(`Schema type for shoeId: ${shoeSchema.instance}`);
    
    if (shoeSchema.instance !== 'Number') {
      console.error('❌ Schema should define shoeId as Number, got:', shoeSchema.instance);
      return false;
    }
    
    console.log('✅ Schema correctly defines shoeId as Number');
    return true;
  } catch (error) {
    console.error('❌ Schema consistency check failed:', error);
    return false;
  }
}

async function analyzeDataMigrationNeeds() {
  console.log('\n💡 Migration Analysis...');
  
  try {
    const stringIdCount = await Shoe.countDocuments({ 
      shoeId: { $type: 'string' } 
    });
    
    const numberIdCount = await Shoe.countDocuments({ 
      shoeId: { $type: 'number' } 
    });
    
    console.log(`String-based IDs: ${stringIdCount}`);
    console.log(`Number-based IDs: ${numberIdCount}`);
    
    if (stringIdCount > 0) {
      console.log('\n⚠️  MIGRATION NEEDED:');
      console.log(`   ${stringIdCount} shoes have string-based IDs that need conversion`);
      
      // Show examples of string IDs
      const stringIdShoes = await Shoe.find({ 
        shoeId: { $type: 'string' } 
      }).limit(5);
      
      console.log('\n   Examples of shoes needing migration:');
      for (const shoe of stringIdShoes) {
        const stringId = String(shoe.shoeId);
        const numericId = parseInt(stringId, 10);
        console.log(`   - "${stringId}" → ${numericId} (${shoe.brand} ${shoe.modelName})`);
      }
      
      console.log('\n   Recommended migration strategy:');
      console.log('   1. Convert string IDs to numbers: "001" → 1, "002" → 2, etc.');
      console.log('   2. Find max numeric ID in database');
      console.log('   3. Update Counter to start from max + 1');
      console.log('   4. Test all existing shoes can be found by new numeric IDs');
      
    } else {
      console.log('✅ All shoes have proper numeric IDs');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Migration analysis failed:', error);
    return false;
  }
}

async function testAPICompatibility() {
  console.log('\n🔍 Testing API Search Compatibility...');
  
  try {
    // Test mixed search query (should handle both string and numeric)
    const mixedQuery = {
      $or: [
        { shoeId: 1 }, // numeric
        { shoeId: "001" }, // string (for backwards compatibility during migration)
        { brand: { $regex: 'Nike', $options: 'i' } }
      ]
    };
    
    const mixedResults = await Shoe.find(mixedQuery);
    console.log(`✅ Mixed search query: found ${mixedResults.length} result(s)`);
    
    // Test pure numeric search
    const numericQuery = { shoeId: { $type: 'number' } };
    const numericResults = await Shoe.find(numericQuery);
    console.log(`✅ Numeric-only search: found ${numericResults.length} result(s)`);
    
    return true;
  } catch (error) {
    console.error('❌ API compatibility test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Starting Comprehensive Shoe ID System Tests\n');
  
  await connectDB();
  
  const tests = [
    { name: 'Schema Consistency', fn: checkSchemaConsistency },
    { name: 'Counter System', fn: testCounterSystem },
    { name: 'Existing Shoes Analysis', fn: testExistingShoes },
    { name: 'New Shoe Creation', fn: testNewShoeCreation },
    { name: 'Search Functionality', fn: testSearchFunctionality },
    { name: 'API Compatibility', fn: testAPICompatibility },
    { name: 'Migration Analysis', fn: analyzeDataMigrationNeeds }
  ];
  
  let passedTests = 0;
  const totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
        console.log(`✅ ${test.name}: PASSED`);
      } else {
        console.log(`❌ ${test.name}: FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR - ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  console.log(`\n📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Shoe ID system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the issues above.');
  }
  
  await mongoose.disconnect();
  console.log('\n🔌 Disconnected from MongoDB');
  
  return passedTests === totalTests;
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });
}

export { runAllTests }; 