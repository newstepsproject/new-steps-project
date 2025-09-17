#!/usr/bin/env node

const mongoose = require('mongoose');

async function fixUserRequestRelationships() {
  try {
    // Connect to production database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://newstepsfit:pAGHNe3%21BKCLdt6@prod-newsteps.mitvzgd.mongodb.net/newsteps?retryWrites=true&w=majority&appName=prod-newsteps';
    
    console.log('🔗 FIXING USER-REQUEST RELATIONSHIPS');
    console.log('===================================');
    console.log('🔌 Connecting to production database...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to production database\n');
    
    const db = mongoose.connection.db;
    const fixes = {
      timestamp: new Date().toISOString(),
      fixesApplied: [],
      errors: []
    };
    
    // Get collections
    const usersCollection = db.collection('users');
    const requestsCollection = db.collection('shoerequests');
    
    // Fix 1: Add userId to shoe requests by matching email addresses
    console.log('🔧 FIX 1: Adding userId to shoe requests...');
    try {
      // Get all shoe requests without userId
      const requestsWithoutUserId = await requestsCollection.find({ 
        $or: [
          { userId: { $exists: false } },
          { userId: null },
          { userId: '' }
        ]
      }).toArray();
      
      console.log(`   Found ${requestsWithoutUserId.length} requests without userId`);
      
      let updatedRequests = 0;
      let unmatchedRequests = 0;
      
      for (const request of requestsWithoutUserId) {
        let userEmail = null;
        
        // Try to extract email from requestorInfo
        if (request.requestorInfo && request.requestorInfo.email) {
          userEmail = request.requestorInfo.email;
        }
        // Try to extract email from shippingInfo
        else if (request.shippingInfo && request.shippingInfo.email) {
          userEmail = request.shippingInfo.email;
        }
        
        if (userEmail) {
          // Find user by email
          const user = await usersCollection.findOne({ email: userEmail });
          
          if (user) {
            // Update request with userId
            await requestsCollection.updateOne(
              { _id: request._id },
              { 
                $set: { 
                  userId: user._id,
                  updatedAt: new Date()
                }
              }
            );
            updatedRequests++;
            console.log(`   ✅ Linked request ${request.referenceId || request._id} to user ${userEmail}`);
          } else {
            unmatchedRequests++;
            console.log(`   ⚠️  No user found for email: ${userEmail} (request: ${request.referenceId || request._id})`);
          }
        } else {
          unmatchedRequests++;
          console.log(`   ⚠️  No email found in request: ${request.referenceId || request._id}`);
        }
      }
      
      console.log(`   ✅ Successfully linked ${updatedRequests} requests to users`);
      console.log(`   ⚠️  ${unmatchedRequests} requests could not be matched`);
      
      fixes.fixesApplied.push({
        fix: 'User-Request Relationship Fix',
        collection: 'shoerequests',
        documentsAffected: updatedRequests,
        unmatchedDocuments: unmatchedRequests,
        description: 'Added userId to shoe requests by matching email addresses'
      });
      
    } catch (error) {
      console.log(`   ❌ Error fixing user-request relationships: ${error.message}`);
      fixes.errors.push({ fix: 'User-Request Relationship Fix', error: error.message });
    }
    
    // Fix 2: Add missing fields to shoe request schema (for future requests)
    console.log('\n🔧 FIX 2: Ensuring all requests have proper structure...');
    try {
      const requestsWithMissingFields = await requestsCollection.find({
        $or: [
          { paymentInfo: { $exists: false } },
          { adminNotes: { $exists: false } }
        ]
      }).toArray();
      
      console.log(`   Found ${requestsWithMissingFields.length} requests with missing fields`);
      
      if (requestsWithMissingFields.length > 0) {
        const result = await requestsCollection.updateMany(
          {
            $or: [
              { paymentInfo: { $exists: false } },
              { adminNotes: { $exists: false } }
            ]
          },
          {
            $set: {
              paymentInfo: null,
              adminNotes: '',
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`   ✅ Updated ${result.modifiedCount} requests with missing fields`);
        fixes.fixesApplied.push({
          fix: 'Request Schema Standardization',
          collection: 'shoerequests',
          documentsAffected: result.modifiedCount,
          description: 'Added missing paymentInfo and adminNotes fields to requests'
        });
      } else {
        console.log('   ✅ All requests already have proper field structure');
      }
      
    } catch (error) {
      console.log(`   ❌ Error standardizing request schema: ${error.message}`);
      fixes.errors.push({ fix: 'Request Schema Standardization', error: error.message });
    }
    
    // Fix 3: Validate and report on relationship integrity
    console.log('\n🔧 FIX 3: Validating relationship integrity...');
    try {
      const totalRequests = await requestsCollection.countDocuments();
      const requestsWithUserId = await requestsCollection.countDocuments({ 
        userId: { $exists: true, $ne: null, $ne: '' }
      });
      
      const relationshipIntegrity = (requestsWithUserId / totalRequests) * 100;
      
      console.log(`   📊 Total requests: ${totalRequests}`);
      console.log(`   📊 Requests with userId: ${requestsWithUserId}`);
      console.log(`   📊 Relationship integrity: ${relationshipIntegrity.toFixed(1)}%`);
      
      fixes.fixesApplied.push({
        fix: 'Relationship Integrity Validation',
        collection: 'shoerequests',
        totalRequests: totalRequests,
        linkedRequests: requestsWithUserId,
        integrityPercentage: relationshipIntegrity,
        description: 'Validated user-request relationship integrity'
      });
      
    } catch (error) {
      console.log(`   ❌ Error validating relationships: ${error.message}`);
      fixes.errors.push({ fix: 'Relationship Integrity Validation', error: error.message });
    }
    
    // Save fix results
    const filename = `user-request-fixes-${Date.now()}.json`;
    require('fs').writeFileSync(filename, JSON.stringify(fixes, null, 2));
    
    // Print summary
    console.log('\n📊 USER-REQUEST RELATIONSHIP FIX SUMMARY');
    console.log('========================================');
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
        if (fix.unmatchedDocuments !== undefined) {
          console.log(`      - Unmatched documents: ${fix.unmatchedDocuments}`);
        }
        if (fix.integrityPercentage !== undefined) {
          console.log(`      - Relationship integrity: ${fix.integrityPercentage.toFixed(1)}%`);
        }
        console.log(`      - Description: ${fix.description}`);
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
    console.error('❌ Critical error during user-request relationship fixes:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the fixes
if (require.main === module) {
  fixUserRequestRelationships()
    .then(() => {
      console.log('\n🎉 User-request relationship fixes completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ User-request relationship fixes failed:', error);
      process.exit(1);
    });
}

module.exports = { fixUserRequestRelationships };
