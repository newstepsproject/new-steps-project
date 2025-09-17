#!/usr/bin/env node

const mongoose = require('mongoose');
const fs = require('fs');

async function comprehensiveDataFlowAnalysis() {
  try {
    // Connect to production database to get real data
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://newstepsfit:pAGHNe3%21BKCLdt6@prod-newsteps.mitvzgd.mongodb.net/newsteps?retryWrites=true&w=majority&appName=prod-newsteps';
    
    console.log('🔍 COMPREHENSIVE DATA-APPLICATION FLOW ANALYSIS');
    console.log('===============================================');
    console.log('🔌 Connecting to production database...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to production database\n');
    
    const analysis = {
      timestamp: new Date().toISOString(),
      collections: {},
      dataFlowGaps: [],
      potentialBugs: [],
      recommendations: []
    };
    
    // Get all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 DATABASE COLLECTIONS FOUND:', collections.length);
    
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\n🔍 Analyzing collection: ${collectionName}`);
      
      try {
        // Get sample documents to understand schema
        const sampleDocs = await mongoose.connection.db.collection(collectionName).find({}).limit(5).toArray();
        const totalCount = await mongoose.connection.db.collection(collectionName).countDocuments();
        
        console.log(`   📈 Total documents: ${totalCount}`);
        console.log(`   📋 Sample documents: ${sampleDocs.length}`);
        
        // Analyze schema structure
        const schemaAnalysis = analyzeCollectionSchema(sampleDocs, collectionName);
        
        analysis.collections[collectionName] = {
          totalDocuments: totalCount,
          sampleDocuments: sampleDocs.length,
          schema: schemaAnalysis,
          sampleData: sampleDocs.map(doc => {
            // Remove sensitive data and limit size
            const cleaned = JSON.parse(JSON.stringify(doc));
            if (cleaned.password) cleaned.password = '[REDACTED]';
            if (cleaned.email && cleaned.email.includes('@')) {
              cleaned.email = cleaned.email.split('@')[0] + '@[DOMAIN]';
            }
            return cleaned;
          })
        };
        
        console.log(`   🏗️  Schema fields: ${Object.keys(schemaAnalysis.fields).length}`);
        
        // Log key fields for manual review
        const keyFields = Object.keys(schemaAnalysis.fields).slice(0, 10);
        console.log(`   🔑 Key fields: ${keyFields.join(', ')}`);
        
      } catch (error) {
        console.log(`   ❌ Error analyzing ${collectionName}:`, error.message);
        analysis.collections[collectionName] = {
          error: error.message,
          totalDocuments: 0
        };
      }
    }
    
    // Perform gap analysis
    console.log('\n🔍 PERFORMING DATA FLOW GAP ANALYSIS...');
    analysis.dataFlowGaps = performGapAnalysis(analysis.collections);
    
    // Identify potential bugs
    console.log('\n🐛 IDENTIFYING POTENTIAL BUGS...');
    analysis.potentialBugs = identifyPotentialBugs(analysis.collections);
    
    // Generate recommendations
    console.log('\n💡 GENERATING RECOMMENDATIONS...');
    analysis.recommendations = generateRecommendations(analysis.collections, analysis.dataFlowGaps, analysis.potentialBugs);
    
    // Save analysis results
    const filename = `data-flow-analysis-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(analysis, null, 2));
    
    console.log('\n📊 ANALYSIS SUMMARY');
    console.log('==================');
    console.log(`📁 Collections analyzed: ${Object.keys(analysis.collections).length}`);
    console.log(`⚠️  Data flow gaps found: ${analysis.dataFlowGaps.length}`);
    console.log(`🐛 Potential bugs identified: ${analysis.potentialBugs.length}`);
    console.log(`💡 Recommendations generated: ${analysis.recommendations.length}`);
    console.log(`📄 Full analysis saved to: ${filename}`);
    
    // Print summary of key findings
    if (analysis.dataFlowGaps.length > 0) {
      console.log('\n🚨 KEY DATA FLOW GAPS:');
      analysis.dataFlowGaps.slice(0, 5).forEach((gap, index) => {
        console.log(`   ${index + 1}. ${gap.type}: ${gap.description}`);
      });
    }
    
    if (analysis.potentialBugs.length > 0) {
      console.log('\n🐛 KEY POTENTIAL BUGS:');
      analysis.potentialBugs.slice(0, 5).forEach((bug, index) => {
        console.log(`   ${index + 1}. ${bug.severity}: ${bug.description}`);
      });
    }
    
    return analysis;
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

function analyzeCollectionSchema(documents, collectionName) {
  const schema = {
    fields: {},
    relationships: [],
    indexes: []
  };
  
  documents.forEach(doc => {
    analyzeDocumentFields(doc, schema.fields, '');
  });
  
  // Identify potential relationships
  schema.relationships = identifyRelationships(documents, collectionName);
  
  return schema;
}

function analyzeDocumentFields(obj, fields, prefix) {
  if (!obj || typeof obj !== 'object') return;
  
  Object.keys(obj).forEach(key => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    if (!fields[fullKey]) {
      fields[fullKey] = {
        type: Array.isArray(value) ? 'array' : typeof value,
        occurrences: 0,
        sampleValues: []
      };
    }
    
    fields[fullKey].occurrences++;
    
    // Store sample values (limit to prevent memory issues)
    if (fields[fullKey].sampleValues.length < 3) {
      if (typeof value === 'string' && value.length < 100) {
        fields[fullKey].sampleValues.push(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        fields[fullKey].sampleValues.push(value);
      }
    }
    
    // Recursively analyze nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      analyzeDocumentFields(value, fields, fullKey);
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      analyzeDocumentFields(value[0], fields, `${fullKey}[0]`);
    }
  });
}

function identifyRelationships(documents, collectionName) {
  const relationships = [];
  
  documents.forEach(doc => {
    // Look for common relationship patterns
    Object.keys(doc).forEach(key => {
      const value = doc[key];
      
      // ObjectId references
      if (value && typeof value === 'object' && value.constructor.name === 'ObjectId') {
        relationships.push({
          type: 'ObjectId Reference',
          field: key,
          targetCollection: 'unknown',
          description: `${collectionName}.${key} references another collection`
        });
      }
      
      // String IDs that might be references
      if (typeof value === 'string' && (key.includes('Id') || key.includes('id')) && value.length > 10) {
        relationships.push({
          type: 'Potential String Reference',
          field: key,
          targetCollection: 'unknown',
          description: `${collectionName}.${key} might reference another collection`
        });
      }
    });
  });
  
  return relationships;
}

function performGapAnalysis(collections) {
  const gaps = [];
  
  // Known application data usage patterns based on the project description
  const expectedDataUsage = {
    users: ['name', 'email', 'role', 'phone', 'address'],
    shoes: ['brand', 'model', 'size', 'condition', 'sport', 'images', 'status', 'donorInfo'],
    donations: ['donorInfo', 'shoes', 'status', 'pickupMethod', 'address'],
    requests: ['userId', 'shoes', 'shippingInfo', 'status', 'paymentInfo'],
    settings: ['projectOfficers', 'ourStory', 'shippingFee', 'maxShoesPerRequest']
  };
  
  // Check for unused fields
  Object.keys(collections).forEach(collectionName => {
    const collection = collections[collectionName];
    if (collection.error) return;
    
    const fields = Object.keys(collection.schema?.fields || {});
    const expectedFields = expectedDataUsage[collectionName] || [];
    
    // Find fields in database but not in expected usage
    fields.forEach(field => {
      const baseField = field.split('.')[0]; // Get root field name
      if (!expectedFields.includes(baseField) && !isSystemField(field)) {
        gaps.push({
          type: 'Unused Data',
          collection: collectionName,
          field: field,
          description: `Field '${field}' exists in database but may not be used in application`,
          severity: 'medium'
        });
      }
    });
    
    // Find expected fields missing from database
    expectedFields.forEach(expectedField => {
      const hasField = fields.some(field => field.startsWith(expectedField));
      if (!hasField) {
        gaps.push({
          type: 'Missing Data',
          collection: collectionName,
          field: expectedField,
          description: `Expected field '${expectedField}' not found in database schema`,
          severity: 'high'
        });
      }
    });
  });
  
  return gaps;
}

function identifyPotentialBugs(collections) {
  const bugs = [];
  
  // Check for common bug patterns
  Object.keys(collections).forEach(collectionName => {
    const collection = collections[collectionName];
    if (collection.error) return;
    
    const fields = collection.schema?.fields || {};
    
    // Look for inconsistent data types
    Object.keys(fields).forEach(fieldName => {
      const field = fields[fieldName];
      
      // Check for fields that should be consistent but have mixed types
      if (field.sampleValues && field.sampleValues.length > 1) {
        const types = [...new Set(field.sampleValues.map(v => typeof v))];
        if (types.length > 1) {
          bugs.push({
            type: 'Data Type Inconsistency',
            collection: collectionName,
            field: fieldName,
            description: `Field '${fieldName}' has inconsistent types: ${types.join(', ')}`,
            severity: 'medium',
            sampleValues: field.sampleValues
          });
        }
      }
      
      // Check for potentially problematic null/undefined values
      if (field.sampleValues && field.sampleValues.includes(null)) {
        bugs.push({
          type: 'Null Values',
          collection: collectionName,
          field: fieldName,
          description: `Field '${fieldName}' contains null values which might cause rendering issues`,
          severity: 'low'
        });
      }
    });
    
    // Check for missing required fields based on project requirements
    const requiredFields = getRequiredFieldsForCollection(collectionName);
    requiredFields.forEach(requiredField => {
      if (!fields[requiredField]) {
        bugs.push({
          type: 'Missing Required Field',
          collection: collectionName,
          field: requiredField,
          description: `Required field '${requiredField}' is missing from collection`,
          severity: 'high'
        });
      }
    });
  });
  
  return bugs;
}

function generateRecommendations(collections, gaps, bugs) {
  const recommendations = [];
  
  // Recommendations based on gaps
  gaps.forEach(gap => {
    if (gap.type === 'Unused Data') {
      recommendations.push({
        type: 'Data Cleanup',
        priority: 'medium',
        description: `Consider removing unused field '${gap.field}' from ${gap.collection} or implement its usage in the application`,
        action: `Review if ${gap.field} should be displayed in admin dashboard or public site`
      });
    } else if (gap.type === 'Missing Data') {
      recommendations.push({
        type: 'Feature Implementation',
        priority: 'high',
        description: `Implement missing field '${gap.field}' in ${gap.collection} collection`,
        action: `Add ${gap.field} to database schema and update application to use it`
      });
    }
  });
  
  // Recommendations based on bugs
  bugs.forEach(bug => {
    if (bug.type === 'Data Type Inconsistency') {
      recommendations.push({
        type: 'Data Standardization',
        priority: 'high',
        description: `Standardize data types for '${bug.field}' in ${bug.collection}`,
        action: `Run data migration to ensure consistent types for ${bug.field}`
      });
    }
  });
  
  return recommendations;
}

function isSystemField(fieldName) {
  const systemFields = ['_id', '__v', 'createdAt', 'updatedAt', 'id'];
  return systemFields.some(sysField => fieldName === sysField || fieldName.endsWith('.' + sysField));
}

function getRequiredFieldsForCollection(collectionName) {
  const requiredFields = {
    users: ['email', 'name'],
    shoes: ['brand', 'size', 'condition', 'status'],
    donations: ['donorInfo', 'status'],
    requests: ['userId', 'status'],
    settings: ['key', 'value']
  };
  
  return requiredFields[collectionName] || [];
}

// Run the analysis
if (require.main === module) {
  comprehensiveDataFlowAnalysis()
    .then(() => {
      console.log('\n🎉 Analysis completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { comprehensiveDataFlowAnalysis };
