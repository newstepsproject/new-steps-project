#!/usr/bin/env node

const mongoose = require('mongoose');
const fs = require('fs');

async function focusedDataUsageAnalysis() {
  try {
    // Connect to production database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://newstepsfit:pAGHNe3%21BKCLdt6@prod-newsteps.mitvzgd.mongodb.net/newsteps?retryWrites=true&w=majority&appName=prod-newsteps';
    
    console.log('🎯 FOCUSED DATA USAGE ANALYSIS');
    console.log('==============================');
    console.log('🔌 Connecting to production database...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to production database\n');
    
    const analysis = {
      timestamp: new Date().toISOString(),
      collections: {},
      applicationDataUsage: {},
      gaps: [],
      bugs: [],
      recommendations: []
    };
    
    // Define what data SHOULD be used based on project requirements
    const expectedApplicationUsage = {
      users: {
        publicSite: ['name', 'email'], // For account page, contact info
        adminDashboard: ['name', 'email', 'role', 'phone', 'emailVerified', 'createdAt', 'firstName', 'lastName']
      },
      shoes: {
        publicSite: ['shoeId', 'brand', 'modelName', 'size', 'gender', 'sport', 'condition', 'images', 'status', 'inventoryCount'],
        adminDashboard: ['shoeId', 'brand', 'modelName', 'size', 'gender', 'sport', 'condition', 'images', 'status', 'inventoryCount', 'donorFirstName', 'donorLastName', 'donorEmail', 'createdAt', 'updatedAt']
      },
      donations: {
        publicSite: ['referenceId'], // For confirmation pages
        adminDashboard: ['referenceId', 'donorInfo', 'shoes', 'status', 'pickupMethod', 'createdAt', 'updatedAt', 'adminNotes']
      },
      shoerequests: {
        publicSite: ['referenceId', 'status'], // For user account page
        adminDashboard: ['referenceId', 'userId', 'items', 'shippingInfo', 'status', 'paymentInfo', 'createdAt', 'updatedAt', 'adminNotes']
      },
      moneydonations: {
        publicSite: ['referenceId'], // For confirmation pages
        adminDashboard: ['referenceId', 'firstName', 'lastName', 'email', 'phone', 'amount', 'status', 'createdAt', 'updatedAt', 'adminNotes']
      },
      volunteers: {
        publicSite: [], // No public display
        adminDashboard: ['firstName', 'lastName', 'email', 'phone', 'skills', 'availability', 'experience', 'createdAt']
      },
      settings: {
        publicSite: ['ourStory', 'projectOfficers'], // For about page
        adminDashboard: ['key', 'value', 'updatedAt'] // For admin settings page
      }
    };
    
    // Analyze each collection
    for (const [collectionName, usage] of Object.entries(expectedApplicationUsage)) {
      console.log(`\n🔍 Analyzing ${collectionName} collection...`);
      
      try {
        const collection = mongoose.connection.db.collection(collectionName);
        const sampleDocs = await collection.find({}).limit(3).toArray();
        const totalCount = await collection.countDocuments();
        
        if (sampleDocs.length === 0) {
          console.log(`   ⚠️  Collection ${collectionName} is empty`);
          analysis.collections[collectionName] = {
            totalDocuments: 0,
            isEmpty: true
          };
          continue;
        }
        
        // Get all actual fields in the collection
        const actualFields = new Set();
        sampleDocs.forEach(doc => {
          extractFields(doc, actualFields, '');
        });
        
        const actualFieldsArray = Array.from(actualFields).filter(field => 
          !field.startsWith('_id') && field !== '__v'
        );
        
        console.log(`   📊 Total documents: ${totalCount}`);
        console.log(`   🏗️  Actual fields: ${actualFieldsArray.length}`);
        console.log(`   📋 Sample fields: ${actualFieldsArray.slice(0, 10).join(', ')}`);
        
        // Compare with expected usage
        const publicExpected = usage.publicSite || [];
        const adminExpected = usage.adminDashboard || [];
        const allExpected = [...new Set([...publicExpected, ...adminExpected])];
        
        // Find gaps
        const unusedFields = actualFieldsArray.filter(field => 
          !allExpected.some(expected => field.startsWith(expected))
        );
        
        const missingFields = allExpected.filter(expected => 
          !actualFieldsArray.some(actual => actual.startsWith(expected))
        );
        
        analysis.collections[collectionName] = {
          totalDocuments: totalCount,
          actualFields: actualFieldsArray,
          expectedPublic: publicExpected,
          expectedAdmin: adminExpected,
          unusedFields: unusedFields,
          missingFields: missingFields,
          sampleData: sampleDocs.map(doc => sanitizeDocument(doc))
        };
        
        // Report findings
        if (unusedFields.length > 0) {
          console.log(`   ⚠️  Unused fields (${unusedFields.length}): ${unusedFields.slice(0, 5).join(', ')}${unusedFields.length > 5 ? '...' : ''}`);
        }
        
        if (missingFields.length > 0) {
          console.log(`   ❌ Missing fields (${missingFields.length}): ${missingFields.join(', ')}`);
        }
        
        if (unusedFields.length === 0 && missingFields.length === 0) {
          console.log(`   ✅ All fields properly aligned with application usage`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error analyzing ${collectionName}:`, error.message);
        analysis.collections[collectionName] = {
          error: error.message
        };
      }
    }
    
    // Perform detailed gap analysis
    console.log('\n🔍 PERFORMING DETAILED GAP ANALYSIS...');
    analysis.gaps = performDetailedGapAnalysis(analysis.collections);
    
    // Identify specific bugs
    console.log('\n🐛 IDENTIFYING SPECIFIC BUGS...');
    analysis.bugs = identifySpecificBugs(analysis.collections);
    
    // Generate actionable recommendations
    console.log('\n💡 GENERATING ACTIONABLE RECOMMENDATIONS...');
    analysis.recommendations = generateActionableRecommendations(analysis.gaps, analysis.bugs);
    
    // Save focused analysis
    const filename = `focused-data-analysis-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(analysis, null, 2));
    
    // Print detailed summary
    printDetailedSummary(analysis);
    
    console.log(`\n📄 Detailed analysis saved to: ${filename}`);
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

function extractFields(obj, fieldsSet, prefix) {
  if (!obj || typeof obj !== 'object') return;
  
  Object.keys(obj).forEach(key => {
    if (key === '_id' || key === '__v') return;
    
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    fieldsSet.add(fullKey);
    
    // Recursively extract nested fields (but limit depth)
    if (value && typeof value === 'object' && !Array.isArray(value) && prefix.split('.').length < 2) {
      extractFields(value, fieldsSet, fullKey);
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && prefix.split('.').length < 2) {
      extractFields(value[0], fieldsSet, `${fullKey}[0]`);
    }
  });
}

function sanitizeDocument(doc) {
  const sanitized = JSON.parse(JSON.stringify(doc));
  
  // Remove sensitive data
  if (sanitized.password) sanitized.password = '[REDACTED]';
  if (sanitized.email && typeof sanitized.email === 'string' && sanitized.email.includes('@')) {
    sanitized.email = sanitized.email.split('@')[0] + '@[DOMAIN]';
  }
  
  // Limit nested object depth for readability
  const limitDepth = (obj, depth = 0) => {
    if (depth > 2 || !obj || typeof obj !== 'object') return obj;
    
    const limited = {};
    Object.keys(obj).slice(0, 10).forEach(key => {
      if (typeof obj[key] === 'object') {
        limited[key] = limitDepth(obj[key], depth + 1);
      } else {
        limited[key] = obj[key];
      }
    });
    return limited;
  };
  
  return limitDepth(sanitized);
}

function performDetailedGapAnalysis(collections) {
  const gaps = [];
  
  Object.keys(collections).forEach(collectionName => {
    const collection = collections[collectionName];
    if (collection.error || collection.isEmpty) return;
    
    // Analyze unused fields
    collection.unusedFields?.forEach(field => {
      gaps.push({
        type: 'Unused Field',
        collection: collectionName,
        field: field,
        severity: determineUnusedFieldSeverity(field, collectionName),
        description: `Field '${field}' exists in ${collectionName} but is not used in public site or admin dashboard`,
        recommendation: `Review if '${field}' should be displayed or can be removed`
      });
    });
    
    // Analyze missing fields
    collection.missingFields?.forEach(field => {
      gaps.push({
        type: 'Missing Field',
        collection: collectionName,
        field: field,
        severity: 'high',
        description: `Expected field '${field}' not found in ${collectionName} collection`,
        recommendation: `Add '${field}' to ${collectionName} schema or remove from application expectations`
      });
    });
  });
  
  return gaps;
}

function determineUnusedFieldSeverity(field, collectionName) {
  // High severity for important business fields
  const importantFields = ['status', 'email', 'name', 'amount', 'referenceId'];
  if (importantFields.some(important => field.includes(important))) {
    return 'high';
  }
  
  // Medium severity for user-facing fields
  const userFields = ['phone', 'address', 'notes', 'description'];
  if (userFields.some(user => field.includes(user))) {
    return 'medium';
  }
  
  // Low severity for metadata fields
  return 'low';
}

function identifySpecificBugs(collections) {
  const bugs = [];
  
  Object.keys(collections).forEach(collectionName => {
    const collection = collections[collectionName];
    if (collection.error || collection.isEmpty) return;
    
    // Check sample data for potential issues
    collection.sampleData?.forEach((doc, index) => {
      // Check for null/undefined in important fields
      const importantFields = ['status', 'email', 'referenceId'];
      importantFields.forEach(field => {
        if (doc[field] === null || doc[field] === undefined || doc[field] === '') {
          bugs.push({
            type: 'Null Important Field',
            collection: collectionName,
            field: field,
            severity: 'high',
            description: `Document ${index + 1} in ${collectionName} has null/empty '${field}' which may cause display issues`,
            sampleValue: doc[field]
          });
        }
      });
      
      // Check for inconsistent data patterns
      if (collectionName === 'shoes' && doc.status && !['available', 'requested', 'shipped', 'unavailable'].includes(doc.status)) {
        bugs.push({
          type: 'Invalid Status Value',
          collection: collectionName,
          field: 'status',
          severity: 'medium',
          description: `Shoe has invalid status '${doc.status}' - should be one of: available, requested, shipped, unavailable`,
          sampleValue: doc.status
        });
      }
      
      // Check for missing required relationships
      if (collectionName === 'shoerequests' && !doc.userId) {
        bugs.push({
          type: 'Missing User Reference',
          collection: collectionName,
          field: 'userId',
          severity: 'high',
          description: `Shoe request missing userId - cannot associate with user account`,
          sampleValue: doc.userId
        });
      }
    });
  });
  
  return bugs;
}

function generateActionableRecommendations(gaps, bugs) {
  const recommendations = [];
  
  // Group gaps by type and severity
  const highSeverityGaps = gaps.filter(gap => gap.severity === 'high');
  const unusedFields = gaps.filter(gap => gap.type === 'Unused Field');
  
  // High priority recommendations
  if (highSeverityGaps.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Critical Data Issues',
      action: 'Immediate Review Required',
      description: `${highSeverityGaps.length} high-severity data gaps found`,
      details: highSeverityGaps.slice(0, 5).map(gap => `${gap.collection}.${gap.field}: ${gap.description}`)
    });
  }
  
  // Bug-based recommendations
  const criticalBugs = bugs.filter(bug => bug.severity === 'high');
  if (criticalBugs.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Data Quality Issues',
      action: 'Fix Data Inconsistencies',
      description: `${criticalBugs.length} critical data quality issues found`,
      details: criticalBugs.map(bug => `${bug.collection}.${bug.field}: ${bug.description}`)
    });
  }
  
  // Unused field recommendations
  if (unusedFields.length > 5) {
    recommendations.push({
      priority: 'MEDIUM',
      category: 'Database Optimization',
      action: 'Review Unused Fields',
      description: `${unusedFields.length} unused fields found - consider cleanup or implementation`,
      details: unusedFields.slice(0, 10).map(gap => `${gap.collection}.${gap.field}`)
    });
  }
  
  return recommendations;
}

function printDetailedSummary(analysis) {
  console.log('\n📊 FOCUSED DATA USAGE ANALYSIS SUMMARY');
  console.log('=====================================');
  
  const collections = Object.keys(analysis.collections).filter(name => 
    !analysis.collections[name].error && !analysis.collections[name].isEmpty
  );
  
  console.log(`📁 Collections analyzed: ${collections.length}`);
  console.log(`⚠️  Total gaps found: ${analysis.gaps.length}`);
  console.log(`🐛 Bugs identified: ${analysis.bugs.length}`);
  console.log(`💡 Recommendations: ${analysis.recommendations.length}`);
  
  // Print collection summary
  console.log('\n📋 COLLECTION SUMMARY:');
  collections.forEach(name => {
    const collection = analysis.collections[name];
    const unusedCount = collection.unusedFields?.length || 0;
    const missingCount = collection.missingFields?.length || 0;
    console.log(`   ${name}: ${collection.totalDocuments} docs, ${unusedCount} unused fields, ${missingCount} missing fields`);
  });
  
  // Print top gaps
  if (analysis.gaps.length > 0) {
    console.log('\n🚨 TOP DATA GAPS:');
    analysis.gaps.slice(0, 10).forEach((gap, index) => {
      console.log(`   ${index + 1}. [${gap.severity.toUpperCase()}] ${gap.collection}.${gap.field}: ${gap.description}`);
    });
  }
  
  // Print bugs
  if (analysis.bugs.length > 0) {
    console.log('\n🐛 DATA QUALITY ISSUES:');
    analysis.bugs.forEach((bug, index) => {
      console.log(`   ${index + 1}. [${bug.severity.toUpperCase()}] ${bug.collection}.${bug.field}: ${bug.description}`);
    });
  }
  
  // Print recommendations
  if (analysis.recommendations.length > 0) {
    console.log('\n💡 KEY RECOMMENDATIONS:');
    analysis.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. [${rec.priority}] ${rec.category}: ${rec.description}`);
    });
  }
}

// Run the analysis
if (require.main === module) {
  focusedDataUsageAnalysis()
    .then(() => {
      console.log('\n🎉 Focused analysis completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { focusedDataUsageAnalysis };
