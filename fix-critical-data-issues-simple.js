#!/usr/bin/env node

const mongoose = require('mongoose');

async function fixCriticalDataIssues() {
  try {
    // Connect to production database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://newstepsfit:pAGHNe3%21BKCLdt6@prod-newsteps.mitvzgd.mongodb.net/newsteps?retryWrites=true&w=majority&appName=prod-newsteps';
    
    console.log('🔧 FIXING CRITICAL DATA ISSUES');
    console.log('==============================');
    console.log('🔌 Connecting to production database...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to production database\n');
    
    const db = mongoose.connection.db;
    const fixes = {
      timestamp: new Date().toISOString(),
      fixesApplied: [],
      errors: []
    };
    
    // Fix 1: Add missing status values to shoes
    console.log('🔧 FIX 1: Adding missing status values to shoes...');
    try {
      const shoesCollection = db.collection('shoes');
      const shoesWithoutStatus = await shoesCollection.find({ 
        $or: [
          { status: { $exists: false } },
          { status: null },
          { status: '' }
        ]
      }).toArray();
      
      console.log(`   Found ${shoesWithoutStatus.length} shoes without proper status`);
      
      if (shoesWithoutStatus.length > 0) {
        const result = await shoesCollection.updateMany(
          { 
            $or: [
              { status: { $exists: false } },
              { status: null },
              { status: '' }
            ]
          },
          { 
            $set: { 
              status: 'available',
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`   ✅ Updated ${result.modifiedCount} shoes with default status 'available'`);
        fixes.fixesApplied.push({
          fix: 'Shoe Status Fix',
          collection: 'shoes',
          documentsAffected: result.modifiedCount,
          description: 'Added default status "available" to shoes missing status field'
        });
      } else {
        console.log('   ✅ All shoes already have proper status values');
      }
    } catch (error) {
      console.log(`   ❌ Error fixing shoe status: ${error.message}`);
      fixes.errors.push({ fix: 'Shoe Status Fix', error: error.message });
    }
    
    // Fix 2: Generate reference IDs for donations
    console.log('\n🔧 FIX 2: Generating reference IDs for donations...');
    try {
      const donationsCollection = db.collection('donations');
      const donationsWithoutRef = await donationsCollection.find({ 
        $or: [
          { referenceId: { $exists: false } },
          { referenceId: null },
          { referenceId: '' }
        ]
      }).toArray();
      
      console.log(`   Found ${donationsWithoutRef.length} donations without reference ID`);
      
      let updatedDonations = 0;
      for (const donation of donationsWithoutRef) {
        const referenceId = generateReferenceId('DON');
        await donationsCollection.updateOne(
          { _id: donation._id },
          { 
            $set: { 
              referenceId: referenceId,
              updatedAt: new Date()
            }
          }
        );
        updatedDonations++;
        
        if (updatedDonations % 10 === 0) {
          console.log(`   Progress: ${updatedDonations}/${donationsWithoutRef.length} donations updated`);
        }
      }
      
      console.log(`   ✅ Generated reference IDs for ${updatedDonations} donations`);
      fixes.fixesApplied.push({
        fix: 'Donation Reference ID Fix',
        collection: 'donations',
        documentsAffected: updatedDonations,
        description: 'Generated reference IDs for donations missing them'
      });
    } catch (error) {
      console.log(`   ❌ Error fixing donation reference IDs: ${error.message}`);
      fixes.errors.push({ fix: 'Donation Reference ID Fix', error: error.message });
    }
    
    // Fix 3: Generate reference IDs for money donations
    console.log('\n🔧 FIX 3: Generating reference IDs for money donations...');
    try {
      const moneyDonationsCollection = db.collection('moneydonations');
      const moneyDonationsWithoutRef = await moneyDonationsCollection.find({ 
        $or: [
          { referenceId: { $exists: false } },
          { referenceId: null },
          { referenceId: '' }
        ]
      }).toArray();
      
      console.log(`   Found ${moneyDonationsWithoutRef.length} money donations without reference ID`);
      
      let updatedMoneyDonations = 0;
      for (const donation of moneyDonationsWithoutRef) {
        const referenceId = generateReferenceId('DM', donation.firstName, donation.lastName);
        await moneyDonationsCollection.updateOne(
          { _id: donation._id },
          { 
            $set: { 
              referenceId: referenceId,
              updatedAt: new Date()
            }
          }
        );
        updatedMoneyDonations++;
      }
      
      console.log(`   ✅ Generated reference IDs for ${updatedMoneyDonations} money donations`);
      fixes.fixesApplied.push({
        fix: 'Money Donation Reference ID Fix',
        collection: 'moneydonations',
        documentsAffected: updatedMoneyDonations,
        description: 'Generated reference IDs for money donations missing them'
      });
    } catch (error) {
      console.log(`   ❌ Error fixing money donation reference IDs: ${error.message}`);
      fixes.errors.push({ fix: 'Money Donation Reference ID Fix', error: error.message });
    }
    
    // Fix 4: Generate reference IDs for shoe requests
    console.log('\n🔧 FIX 4: Generating reference IDs for shoe requests...');
    try {
      const requestsCollection = db.collection('shoerequests');
      const requestsWithoutRef = await requestsCollection.find({ 
        $or: [
          { referenceId: { $exists: false } },
          { referenceId: null },
          { referenceId: '' }
        ]
      }).toArray();
      
      console.log(`   Found ${requestsWithoutRef.length} shoe requests without reference ID`);
      
      let updatedRequests = 0;
      for (const request of requestsWithoutRef) {
        const referenceId = generateReferenceId('REQ');
        await requestsCollection.updateOne(
          { _id: request._id },
          { 
            $set: { 
              referenceId: referenceId,
              updatedAt: new Date()
            }
          }
        );
        updatedRequests++;
      }
      
      console.log(`   ✅ Generated reference IDs for ${updatedRequests} shoe requests`);
      fixes.fixesApplied.push({
        fix: 'Shoe Request Reference ID Fix',
        collection: 'shoerequests',
        documentsAffected: updatedRequests,
        description: 'Generated reference IDs for shoe requests missing them'
      });
    } catch (error) {
      console.log(`   ❌ Error fixing shoe request reference IDs: ${error.message}`);
      fixes.errors.push({ fix: 'Shoe Request Reference ID Fix', error: error.message });
    }
    
    // Fix 5: Add default status to volunteers
    console.log('\n🔧 FIX 5: Adding default status to volunteers...');
    try {
      const volunteersCollection = db.collection('volunteers');
      const volunteersWithoutStatus = await volunteersCollection.find({ 
        $or: [
          { status: { $exists: false } },
          { status: null },
          { status: '' }
        ]
      }).toArray();
      
      console.log(`   Found ${volunteersWithoutStatus.length} volunteers without status`);
      
      if (volunteersWithoutStatus.length > 0) {
        const result = await volunteersCollection.updateMany(
          { 
            $or: [
              { status: { $exists: false } },
              { status: null },
              { status: '' }
            ]
          },
          { 
            $set: { 
              status: 'submitted',
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`   ✅ Updated ${result.modifiedCount} volunteers with default status 'submitted'`);
        fixes.fixesApplied.push({
          fix: 'Volunteer Status Fix',
          collection: 'volunteers',
          documentsAffected: result.modifiedCount,
          description: 'Added default status "submitted" to volunteers missing status field'
        });
      } else {
        console.log('   ✅ All volunteers already have proper status values');
      }
    } catch (error) {
      console.log(`   ❌ Error fixing volunteer status: ${error.message}`);
      fixes.errors.push({ fix: 'Volunteer Status Fix', error: error.message });
    }
    
    // Fix 6: Ensure shoe requests have proper status
    console.log('\n🔧 FIX 6: Adding default status to shoe requests...');
    try {
      const requestsCollection = db.collection('shoerequests');
      const requestsWithoutStatus = await requestsCollection.find({ 
        $or: [
          { status: { $exists: false } },
          { status: null },
          { status: '' }
        ]
      }).toArray();
      
      console.log(`   Found ${requestsWithoutStatus.length} shoe requests without status`);
      
      if (requestsWithoutStatus.length > 0) {
        const result = await requestsCollection.updateMany(
          { 
            $or: [
              { status: { $exists: false } },
              { status: null },
              { status: '' }
            ]
          },
          { 
            $set: { 
              status: 'submitted',
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`   ✅ Updated ${result.modifiedCount} shoe requests with default status 'submitted'`);
        fixes.fixesApplied.push({
          fix: 'Shoe Request Status Fix',
          collection: 'shoerequests',
          documentsAffected: result.modifiedCount,
          description: 'Added default status "submitted" to shoe requests missing status field'
        });
      } else {
        console.log('   ✅ All shoe requests already have proper status values');
      }
    } catch (error) {
      console.log(`   ❌ Error fixing shoe request status: ${error.message}`);
      fixes.errors.push({ fix: 'Shoe Request Status Fix', error: error.message });
    }
    
    // Save fix results
    const filename = `data-fixes-${Date.now()}.json`;
    require('fs').writeFileSync(filename, JSON.stringify(fixes, null, 2));
    
    // Print summary
    console.log('\n📊 FIX SUMMARY');
    console.log('==============');
    console.log(`✅ Fixes applied: ${fixes.fixesApplied.length}`);
    console.log(`❌ Errors encountered: ${fixes.errors.length}`);
    
    let totalDocumentsFixed = 0;
    if (fixes.fixesApplied.length > 0) {
      console.log('\n🎉 SUCCESSFUL FIXES:');
      fixes.fixesApplied.forEach((fix, index) => {
        console.log(`   ${index + 1}. ${fix.fix}: ${fix.documentsAffected} documents updated`);
        totalDocumentsFixed += fix.documentsAffected;
      });
    }
    
    if (fixes.errors.length > 0) {
      console.log('\n❌ ERRORS ENCOUNTERED:');
      fixes.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.fix}: ${error.error}`);
      });
    }
    
    console.log(`\n🎯 TOTAL IMPACT: ${totalDocumentsFixed} documents fixed across ${fixes.fixesApplied.length} collections`);
    console.log(`📄 Detailed results saved to: ${filename}`);
    
    return fixes;
    
  } catch (error) {
    console.error('❌ Critical error during fixes:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

function generateReferenceId(prefix, firstName = '', lastName = '') {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  if (prefix === 'DM' && firstName && lastName) {
    // Money donation format: DM-FIRST-NNNN
    const namePrefix = firstName.substring(0, 4).toUpperCase();
    const number = timestamp.slice(-4);
    return `${prefix}-${namePrefix}-${number}`;
  } else {
    // Standard format: PREFIX-YYYYMMDD-XXXX
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `${prefix}-${date}-${random}`;
  }
}

// Run the fixes
if (require.main === module) {
  fixCriticalDataIssues()
    .then(() => {
      console.log('\n🎉 Critical data fixes completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Critical data fixes failed:', error);
      process.exit(1);
    });
}

module.exports = { fixCriticalDataIssues };
