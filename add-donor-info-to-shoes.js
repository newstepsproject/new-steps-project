#!/usr/bin/env node

const mongoose = require('mongoose');

async function addDonorInfoToShoes() {
  try {
    // Connect to production database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://newstepsfit:pAGHNe3%21BKCLdt6@prod-newsteps.mitvzgd.mongodb.net/newsteps?retryWrites=true&w=majority&appName=prod-newsteps';
    
    console.log('👤 ADDING DONOR INFORMATION TO SHOES');
    console.log('====================================');
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
    const shoesCollection = db.collection('shoes');
    const donationsCollection = db.collection('donations');
    
    // Fix 1: Add donor information to shoes by linking with donations
    console.log('🔧 FIX 1: Linking shoes with donor information...');
    try {
      // Get all shoes without donor information
      const shoesWithoutDonorInfo = await shoesCollection.find({
        $or: [
          { donorFirstName: { $exists: false } },
          { donorLastName: { $exists: false } },
          { donorEmail: { $exists: false } }
        ]
      }).toArray();
      
      console.log(`   Found ${shoesWithoutDonorInfo.length} shoes without donor information`);
      
      let updatedShoes = 0;
      let unmatchedShoes = 0;
      
      for (const shoe of shoesWithoutDonorInfo) {
        let donorInfo = null;
        
        // Try to find donation by donationId if it exists
        if (shoe.donationId) {
          const donation = await donationsCollection.findOne({ 
            $or: [
              { _id: shoe.donationId },
              { donationId: shoe.donationId },
              { referenceId: shoe.donationId }
            ]
          });
          
          if (donation && donation.donorInfo) {
            donorInfo = donation.donorInfo;
          }
        }
        
        // If no donation found by ID, try to match by shoe details or timing
        if (!donorInfo) {
          // Look for donations around the same time as the shoe creation
          const shoeDate = shoe.createdAt || shoe._id.getTimestamp();
          const timeWindow = 24 * 60 * 60 * 1000; // 24 hours
          
          const nearbyDonations = await donationsCollection.find({
            createdAt: {
              $gte: new Date(shoeDate.getTime() - timeWindow),
              $lte: new Date(shoeDate.getTime() + timeWindow)
            },
            'donorInfo.firstName': { $exists: true },
            'donorInfo.lastName': { $exists: true }
          }).toArray();
          
          // If only one donation in the time window, likely match
          if (nearbyDonations.length === 1) {
            donorInfo = nearbyDonations[0].donorInfo;
            console.log(`   🔍 Matched shoe ${shoe.shoeId} with donation by timing`);
          }
        }
        
        if (donorInfo) {
          // Update shoe with donor information
          const updateData = {
            updatedAt: new Date()
          };
          
          if (donorInfo.firstName) updateData.donorFirstName = donorInfo.firstName;
          if (donorInfo.lastName) updateData.donorLastName = donorInfo.lastName;
          if (donorInfo.email) updateData.donorEmail = donorInfo.email;
          
          await shoesCollection.updateOne(
            { _id: shoe._id },
            { $set: updateData }
          );
          
          updatedShoes++;
          console.log(`   ✅ Added donor info to shoe ${shoe.shoeId || shoe._id}: ${donorInfo.firstName} ${donorInfo.lastName}`);
        } else {
          // Add placeholder donor info for shoes without matches
          await shoesCollection.updateOne(
            { _id: shoe._id },
            { 
              $set: {
                donorFirstName: 'Anonymous',
                donorLastName: 'Donor',
                donorEmail: '',
                updatedAt: new Date()
              }
            }
          );
          unmatchedShoes++;
          console.log(`   ⚠️  No donor found for shoe ${shoe.shoeId || shoe._id}, set as Anonymous Donor`);
        }
      }
      
      console.log(`   ✅ Successfully added donor info to ${updatedShoes} shoes`);
      console.log(`   ⚠️  ${unmatchedShoes} shoes set as Anonymous Donor`);
      
      fixes.fixesApplied.push({
        fix: 'Shoe-Donor Information Link',
        collection: 'shoes',
        documentsAffected: updatedShoes + unmatchedShoes,
        matchedDonors: updatedShoes,
        anonymousDonors: unmatchedShoes,
        description: 'Added donor information to shoes by linking with donations'
      });
      
    } catch (error) {
      console.log(`   ❌ Error adding donor info to shoes: ${error.message}`);
      fixes.errors.push({ fix: 'Shoe-Donor Information Link', error: error.message });
    }
    
    // Fix 2: Ensure all shoes have admin notes field
    console.log('\n🔧 FIX 2: Adding admin notes field to shoes...');
    try {
      const shoesWithoutAdminNotes = await shoesCollection.find({
        adminNotes: { $exists: false }
      }).toArray();
      
      console.log(`   Found ${shoesWithoutAdminNotes.length} shoes without admin notes field`);
      
      if (shoesWithoutAdminNotes.length > 0) {
        const result = await shoesCollection.updateMany(
          { adminNotes: { $exists: false } },
          {
            $set: {
              adminNotes: '',
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`   ✅ Added admin notes field to ${result.modifiedCount} shoes`);
        fixes.fixesApplied.push({
          fix: 'Shoe Admin Notes Field',
          collection: 'shoes',
          documentsAffected: result.modifiedCount,
          description: 'Added admin notes field to shoes for admin management'
        });
      } else {
        console.log('   ✅ All shoes already have admin notes field');
      }
      
    } catch (error) {
      console.log(`   ❌ Error adding admin notes field: ${error.message}`);
      fixes.errors.push({ fix: 'Shoe Admin Notes Field', error: error.message });
    }
    
    // Fix 3: Validate donor information completeness
    console.log('\n🔧 FIX 3: Validating donor information completeness...');
    try {
      const totalShoes = await shoesCollection.countDocuments();
      const shoesWithDonorInfo = await shoesCollection.countDocuments({
        donorFirstName: { $exists: true, $ne: null, $ne: '' },
        donorLastName: { $exists: true, $ne: null, $ne: '' }
      });
      const shoesWithDonorEmail = await shoesCollection.countDocuments({
        donorEmail: { $exists: true, $ne: null, $ne: '' }
      });
      
      const nameCompleteness = (shoesWithDonorInfo / totalShoes) * 100;
      const emailCompleteness = (shoesWithDonorEmail / totalShoes) * 100;
      
      console.log(`   📊 Total shoes: ${totalShoes}`);
      console.log(`   📊 Shoes with donor names: ${shoesWithDonorInfo} (${nameCompleteness.toFixed(1)}%)`);
      console.log(`   📊 Shoes with donor emails: ${shoesWithDonorEmail} (${emailCompleteness.toFixed(1)}%)`);
      
      fixes.fixesApplied.push({
        fix: 'Donor Information Completeness Validation',
        collection: 'shoes',
        totalShoes: totalShoes,
        shoesWithNames: shoesWithDonorInfo,
        shoesWithEmails: shoesWithDonorEmail,
        nameCompleteness: nameCompleteness,
        emailCompleteness: emailCompleteness,
        description: 'Validated donor information completeness across shoe inventory'
      });
      
    } catch (error) {
      console.log(`   ❌ Error validating donor information: ${error.message}`);
      fixes.errors.push({ fix: 'Donor Information Completeness Validation', error: error.message });
    }
    
    // Save fix results
    const filename = `donor-info-fixes-${Date.now()}.json`;
    require('fs').writeFileSync(filename, JSON.stringify(fixes, null, 2));
    
    // Print summary
    console.log('\n📊 DONOR INFORMATION FIX SUMMARY');
    console.log('================================');
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
        if (fix.matchedDonors !== undefined) {
          console.log(`      - Matched donors: ${fix.matchedDonors}`);
          console.log(`      - Anonymous donors: ${fix.anonymousDonors}`);
        }
        if (fix.nameCompleteness !== undefined) {
          console.log(`      - Name completeness: ${fix.nameCompleteness.toFixed(1)}%`);
          console.log(`      - Email completeness: ${fix.emailCompleteness.toFixed(1)}%`);
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
    console.error('❌ Critical error during donor information fixes:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the fixes
if (require.main === module) {
  addDonorInfoToShoes()
    .then(() => {
      console.log('\n🎉 Donor information fixes completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Donor information fixes failed:', error);
      process.exit(1);
    });
}

module.exports = { addDonorInfoToShoes };
