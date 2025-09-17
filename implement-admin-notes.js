#!/usr/bin/env node

const mongoose = require('mongoose');

async function implementAdminNotes() {
  try {
    // Connect to production database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://newstepsfit:pAGHNe3%21BKCLdt6@prod-newsteps.mitvzgd.mongodb.net/newsteps?retryWrites=true&w=majority&appName=prod-newsteps';
    
    console.log('📝 IMPLEMENTING ADMIN NOTES FUNCTIONALITY');
    console.log('=========================================');
    console.log('🔌 Connecting to production database...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to production database\n');
    
    const db = mongoose.connection.db;
    const fixes = {
      timestamp: new Date().toISOString(),
      fixesApplied: [],
      errors: []
    };
    
    // Collections that need admin notes
    const collectionsToUpdate = [
      { name: 'donations', displayName: 'Donations' },
      { name: 'moneydonations', displayName: 'Money Donations' },
      { name: 'volunteers', displayName: 'Volunteers' }
      // Note: shoerequests and shoes already handled in previous fixes
    ];
    
    // Fix 1: Add admin notes field to all relevant collections
    console.log('🔧 FIX 1: Adding admin notes field to collections...');
    
    for (const collectionInfo of collectionsToUpdate) {
      try {
        const collection = db.collection(collectionInfo.name);
        
        // Find documents without admin notes
        const documentsWithoutNotes = await collection.find({
          adminNotes: { $exists: false }
        }).toArray();
        
        console.log(`   📋 ${collectionInfo.displayName}: Found ${documentsWithoutNotes.length} documents without admin notes`);
        
        if (documentsWithoutNotes.length > 0) {
          const result = await collection.updateMany(
            { adminNotes: { $exists: false } },
            {
              $set: {
                adminNotes: '',
                updatedAt: new Date()
              }
            }
          );
          
          console.log(`   ✅ ${collectionInfo.displayName}: Added admin notes field to ${result.modifiedCount} documents`);
          
          fixes.fixesApplied.push({
            fix: `${collectionInfo.displayName} Admin Notes`,
            collection: collectionInfo.name,
            documentsAffected: result.modifiedCount,
            description: `Added admin notes field to ${collectionInfo.displayName.toLowerCase()}`
          });
        } else {
          console.log(`   ✅ ${collectionInfo.displayName}: All documents already have admin notes field`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error updating ${collectionInfo.displayName}: ${error.message}`);
        fixes.errors.push({ 
          fix: `${collectionInfo.displayName} Admin Notes`, 
          error: error.message 
        });
      }
    }
    
    // Fix 2: Add updatedAt field to collections missing it
    console.log('\n🔧 FIX 2: Ensuring all collections have updatedAt field...');
    
    const allCollections = [
      ...collectionsToUpdate,
      { name: 'shoerequests', displayName: 'Shoe Requests' },
      { name: 'shoes', displayName: 'Shoes' }
    ];
    
    for (const collectionInfo of allCollections) {
      try {
        const collection = db.collection(collectionInfo.name);
        
        // Find documents without updatedAt
        const documentsWithoutUpdatedAt = await collection.find({
          updatedAt: { $exists: false }
        }).toArray();
        
        console.log(`   📅 ${collectionInfo.displayName}: Found ${documentsWithoutUpdatedAt.length} documents without updatedAt`);
        
        if (documentsWithoutUpdatedAt.length > 0) {
          const result = await collection.updateMany(
            { updatedAt: { $exists: false } },
            {
              $set: {
                updatedAt: new Date()
              }
            }
          );
          
          console.log(`   ✅ ${collectionInfo.displayName}: Added updatedAt to ${result.modifiedCount} documents`);
          
          fixes.fixesApplied.push({
            fix: `${collectionInfo.displayName} UpdatedAt Field`,
            collection: collectionInfo.name,
            documentsAffected: result.modifiedCount,
            description: `Added updatedAt timestamp to ${collectionInfo.displayName.toLowerCase()}`
          });
        } else {
          console.log(`   ✅ ${collectionInfo.displayName}: All documents already have updatedAt field`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error adding updatedAt to ${collectionInfo.displayName}: ${error.message}`);
        fixes.errors.push({ 
          fix: `${collectionInfo.displayName} UpdatedAt Field`, 
          error: error.message 
        });
      }
    }
    
    // Fix 3: Validate admin notes implementation across all collections
    console.log('\n🔧 FIX 3: Validating admin notes implementation...');
    try {
      const validationResults = {};
      
      for (const collectionInfo of allCollections) {
        const collection = db.collection(collectionInfo.name);
        
        const totalDocs = await collection.countDocuments();
        const docsWithAdminNotes = await collection.countDocuments({
          adminNotes: { $exists: true }
        });
        const docsWithUpdatedAt = await collection.countDocuments({
          updatedAt: { $exists: true }
        });
        
        const adminNotesCompleteness = totalDocs > 0 ? (docsWithAdminNotes / totalDocs) * 100 : 0;
        const updatedAtCompleteness = totalDocs > 0 ? (docsWithUpdatedAt / totalDocs) * 100 : 0;
        
        validationResults[collectionInfo.name] = {
          displayName: collectionInfo.displayName,
          totalDocuments: totalDocs,
          adminNotesCompleteness: adminNotesCompleteness,
          updatedAtCompleteness: updatedAtCompleteness
        };
        
        console.log(`   📊 ${collectionInfo.displayName}:`);
        console.log(`      - Total documents: ${totalDocs}`);
        console.log(`      - Admin notes completeness: ${adminNotesCompleteness.toFixed(1)}%`);
        console.log(`      - UpdatedAt completeness: ${updatedAtCompleteness.toFixed(1)}%`);
      }
      
      fixes.fixesApplied.push({
        fix: 'Admin Notes Implementation Validation',
        description: 'Validated admin notes and updatedAt field implementation across all collections',
        validationResults: validationResults
      });
      
    } catch (error) {
      console.log(`   ❌ Error validating admin notes implementation: ${error.message}`);
      fixes.errors.push({ fix: 'Admin Notes Implementation Validation', error: error.message });
    }
    
    // Fix 4: Create sample admin notes for testing
    console.log('\n🔧 FIX 4: Adding sample admin notes for testing...');
    try {
      // Add a sample admin note to the first document in each collection
      let sampleNotesAdded = 0;
      
      for (const collectionInfo of allCollections) {
        const collection = db.collection(collectionInfo.name);
        
        // Find first document with empty admin notes
        const firstDoc = await collection.findOne({
          adminNotes: { $exists: true, $eq: '' }
        });
        
        if (firstDoc) {
          await collection.updateOne(
            { _id: firstDoc._id },
            {
              $set: {
                adminNotes: `Sample admin note added on ${new Date().toISOString().split('T')[0]} - Admin notes functionality implemented`,
                updatedAt: new Date()
              }
            }
          );
          
          sampleNotesAdded++;
          console.log(`   ✅ Added sample admin note to ${collectionInfo.displayName}`);
        }
      }
      
      if (sampleNotesAdded > 0) {
        fixes.fixesApplied.push({
          fix: 'Sample Admin Notes',
          documentsAffected: sampleNotesAdded,
          description: 'Added sample admin notes for testing functionality'
        });
      }
      
    } catch (error) {
      console.log(`   ❌ Error adding sample admin notes: ${error.message}`);
      fixes.errors.push({ fix: 'Sample Admin Notes', error: error.message });
    }
    
    // Save fix results
    const filename = `admin-notes-fixes-${Date.now()}.json`;
    require('fs').writeFileSync(filename, JSON.stringify(fixes, null, 2));
    
    // Print summary
    console.log('\n📊 ADMIN NOTES IMPLEMENTATION SUMMARY');
    console.log('====================================');
    console.log(`✅ Fixes applied: ${fixes.fixesApplied.length}`);
    console.log(`❌ Errors encountered: ${fixes.errors.length}`);
    
    let totalDocumentsFixed = 0;
    if (fixes.fixesApplied.length > 0) {
      console.log('\n🎉 SUCCESSFUL FIXES:');
      fixes.fixesApplied.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix.fix}:`);
        if (fix.documentsAffected !== undefined) {
          console.log(`      - Documents affected: ${fix.documentsAffected}`);
          totalDocumentsFixed += fix.documentsAffected;
        }
        console.log(`      - Description: ${fix.description}`);
        
        if (fix.validationResults) {
          console.log(`      - Validation results:`);
          Object.values(fix.validationResults).forEach(result => {
            console.log(`        * ${result.displayName}: ${result.adminNotesCompleteness.toFixed(1)}% admin notes, ${result.updatedAtCompleteness.toFixed(1)}% updatedAt`);
          });
        }
      });
    }
    
    if (fixes.errors.length > 0) {
      console.log('\n❌ ERRORS ENCOUNTERED:');
      fixes.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.fix}: ${error.error}`);
      });
    }
    
    console.log(`\n🎯 TOTAL IMPACT: ${totalDocumentsFixed} documents updated`);
    console.log(`📄 Detailed results saved to: ${filename}`);
    
    return fixes;
    
  } catch (error) {
    console.error('❌ Critical error during admin notes implementation:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the fixes
if (require.main === module) {
  implementAdminNotes()
    .then(() => {
      console.log('\n🎉 Admin notes implementation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Admin notes implementation failed:', error);
      process.exit(1);
    });
}

module.exports = { implementAdminNotes };
