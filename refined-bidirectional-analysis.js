#!/usr/bin/env node

/**
 * REFINED BIDIRECTIONAL DATA-APPLICATION VERIFICATION
 * 
 * This refined version addresses the issues found in the initial analysis
 * and provides more accurate detection of actual logic bugs.
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Analysis results
const analysisResults = {
  timestamp: new Date().toISOString(),
  databaseAnalysis: {
    collections: {},
    totalDocuments: 0,
    totalFields: 0
  },
  applicationAnalysis: {
    formComponents: {},
    apiEndpoints: {},
    totalInputs: 0,
    totalDisplays: 0
  },
  criticalFindings: {
    actualBugs: [],
    missingFeatures: [],
    dataInconsistencies: [],
    performanceIssues: []
  },
  recommendations: {
    immediate: [],
    shortTerm: [],
    longTerm: []
  }
};

/**
 * ENHANCED DATABASE ANALYSIS WITH PROPER ERROR HANDLING
 */
async function analyzeDatabaseComprehensively() {
  console.log('🔍 ENHANCED DATABASE ANALYSIS');
  
  try {
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections`);
    
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\n📋 Analyzing collection: ${collectionName}`);
      
      // Get sample documents
      const sampleDocs = await mongoose.connection.db
        .collection(collectionName)
        .find({})
        .limit(20)
        .toArray();
      
      // Get document count
      const docCount = await mongoose.connection.db
        .collection(collectionName)
        .countDocuments();
      
      // Analyze field patterns
      const fieldAnalysis = analyzeFieldsInDepth(sampleDocs);
      
      analysisResults.databaseAnalysis.collections[collectionName] = {
        documentCount: docCount,
        sampleSize: sampleDocs.length,
        fields: fieldAnalysis.fields,
        fieldStats: fieldAnalysis.stats,
        dataQuality: fieldAnalysis.quality,
        businessRelevance: assessBusinessRelevance(collectionName, fieldAnalysis.fields)
      };
      
      analysisResults.databaseAnalysis.totalDocuments += docCount;
      analysisResults.databaseAnalysis.totalFields += Object.keys(fieldAnalysis.fields).length;
      
      console.log(`  📈 Documents: ${docCount}, Fields: ${Object.keys(fieldAnalysis.fields).length}`);
    }
    
  } catch (error) {
    console.error('❌ Database analysis error:', error);
  }
}

/**
 * Analyze fields with business context
 */
function analyzeFieldsInDepth(documents) {
  const fields = {};
  const stats = {};
  const quality = {};
  
  documents.forEach((doc, index) => {
    extractFieldsRecursively(doc, '', fields, stats, quality, index);
  });
  
  // Calculate statistics
  Object.keys(fields).forEach(fieldName => {
    const field = fields[fieldName];
    stats[fieldName] = {
      populationRate: ((field.populatedCount || 0) / documents.length * 100).toFixed(1),
      dataQuality: field.nullCount === 0 ? 'GOOD' : field.nullCount < documents.length * 0.5 ? 'FAIR' : 'POOR',
      businessImportance: assessFieldImportance(fieldName, field)
    };
  });
  
  return { fields, stats, quality };
}

/**
 * Extract fields recursively with better tracking
 */
function extractFieldsRecursively(obj, prefix, fields, stats, quality, docIndex) {
  if (!obj || typeof obj !== 'object') return;
  
  Object.keys(obj).forEach(key => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    if (!fields[fullKey]) {
      fields[fullKey] = {
        type: Array.isArray(value) ? 'array' : typeof value,
        examples: [],
        nullCount: 0,
        populatedCount: 0,
        isNested: prefix.length > 0
      };
    }
    
    // Track population
    if (value !== null && value !== undefined && value !== '') {
      fields[fullKey].populatedCount++;
      if (fields[fullKey].examples.length < 3) {
        fields[fullKey].examples.push(value);
      }
    } else {
      fields[fullKey].nullCount++;
    }
    
    // Recurse for nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      extractFieldsRecursively(value, fullKey, fields, stats, quality, docIndex);
    }
  });
}

/**
 * Assess business relevance of collection
 */
function assessBusinessRelevance(collectionName, fields) {
  const userFacingCollections = ['users', 'shoes', 'donations', 'shoerequests', 'moneydonations', 'volunteers'];
  const adminCollections = ['settings', 'counters'];
  
  if (userFacingCollections.includes(collectionName.toLowerCase())) {
    return 'HIGH';
  } else if (adminCollections.includes(collectionName.toLowerCase())) {
    return 'MEDIUM';
  }
  return 'LOW';
}

/**
 * Assess field importance based on name and content
 */
function assessFieldImportance(fieldName, field) {
  const criticalFields = ['email', 'name', 'firstname', 'lastname', 'status', 'referenceid'];
  const importantFields = ['phone', 'address', 'notes', 'createdat', 'updatedat'];
  
  const lowerFieldName = fieldName.toLowerCase();
  
  if (criticalFields.some(cf => lowerFieldName.includes(cf))) {
    return 'CRITICAL';
  } else if (importantFields.some(imf => lowerFieldName.includes(imf))) {
    return 'IMPORTANT';
  } else if (field.populatedCount > 0) {
    return 'USEFUL';
  }
  return 'OPTIONAL';
}

/**
 * REFINED APPLICATION ANALYSIS
 */
async function analyzeApplicationIntelligently() {
  console.log('\n🔍 REFINED APPLICATION ANALYSIS');
  
  // Focus on key form components
  await analyzeKeyFormComponents();
  
  // Analyze API data handling
  await analyzeApiDataHandling();
  
  // Check admin interfaces
  await analyzeAdminDataManagement();
}

/**
 * Analyze key form components that handle user data
 */
async function analyzeKeyFormComponents() {
  console.log('📋 Analyzing key form components...');
  
  const keyForms = [
    'src/app/register',
    'src/app/checkout', 
    'src/app/volunteer',
    'src/app/donate',
    'src/app/contact',
    'src/components/admin'
  ];
  
  for (const formPath of keyForms) {
    if (fs.existsSync(formPath)) {
      await analyzeFormDirectory(formPath);
    }
  }
}

/**
 * Analyze form directory for actual form fields
 */
async function analyzeFormDirectory(dirPath) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      await analyzeFormDirectory(filePath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      await analyzeFormFile(filePath);
    }
  }
}

/**
 * Analyze individual form file for real form fields
 */
async function analyzeFormFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Look for actual form field patterns
    const formFields = extractRealFormFields(content);
    
    if (formFields.length > 0) {
      analysisResults.applicationAnalysis.formComponents[relativePath] = {
        fields: formFields,
        isUserFacing: !relativePath.includes('admin'),
        isDataCollection: formFields.some(f => f.type === 'input')
      };
      
      analysisResults.applicationAnalysis.totalInputs += formFields.filter(f => f.type === 'input').length;
      analysisResults.applicationAnalysis.totalDisplays += formFields.filter(f => f.type === 'display').length;
    }
    
  } catch (error) {
    console.error(`❌ Error analyzing form ${filePath}:`, error.message);
  }
}

/**
 * Extract real form fields (not just any variable)
 */
function extractRealFormFields(content) {
  const fields = [];
  
  // Look for actual HTML form inputs
  const inputPatterns = [
    /<Input[^>]*name=["']([^"']+)["'][^>]*>/gi,
    /<Textarea[^>]*name=["']([^"']+)["'][^>]*>/gi,
    /<Select[^>]*name=["']([^"']+)["'][^>]*>/gi
  ];
  
  inputPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      fields.push({
        type: 'input',
        name: match[1],
        element: match[0].split(' ')[0].replace('<', '').toLowerCase()
      });
    }
  });
  
  // Look for form submission patterns
  const submitPatterns = [
    /const\s+handleSubmit[^{]*{[^}]*fetch\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    /await\s+fetch\s*\(\s*['"`]([^'"`]+)['"`][^,]*,\s*{[^}]*method:\s*['"`]POST['"`]/gi
  ];
  
  submitPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      fields.push({
        type: 'submission',
        endpoint: match[1]
      });
    }
  });
  
  return fields;
}

/**
 * Analyze API endpoints for data handling patterns
 */
async function analyzeApiDataHandling() {
  console.log('📋 Analyzing API data handling...');
  
  const apiDir = 'src/app/api';
  if (fs.existsSync(apiDir)) {
    await analyzeApiDirectory(apiDir);
  }
}

/**
 * Analyze API directory
 */
async function analyzeApiDirectory(dirPath) {
  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      await analyzeApiDirectory(filePath);
    } else if (file.name === 'route.ts' || file.name === 'route.js') {
      await analyzeApiFile(filePath);
    }
  }
}

/**
 * Analyze API file for data operations
 */
async function analyzeApiFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    const apiOperations = extractApiOperations(content);
    
    if (apiOperations.length > 0) {
      analysisResults.applicationAnalysis.apiEndpoints[relativePath] = {
        operations: apiOperations,
        endpoint: relativePath.replace('src/app/api/', '').replace('/route.ts', '').replace('/route.js', '')
      };
    }
    
  } catch (error) {
    console.error(`❌ Error analyzing API ${filePath}:`, error.message);
  }
}

/**
 * Extract API operations
 */
function extractApiOperations(content) {
  const operations = [];
  
  // Database operations
  const dbPatterns = [
    { pattern: /\.create\s*\(\s*({[^}]+})/gi, type: 'CREATE' },
    { pattern: /\.findOneAndUpdate\s*\([^,]+,\s*({[^}]+})/gi, type: 'UPDATE' },
    { pattern: /\.save\s*\(\s*\)/gi, type: 'SAVE' },
    { pattern: /\.find\s*\(\s*({[^}]*})\s*\)/gi, type: 'READ' }
  ];
  
  dbPatterns.forEach(({ pattern, type }) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      operations.push({
        type: type,
        operation: match[0],
        data: match[1] || 'none'
      });
    }
  });
  
  return operations;
}

/**
 * Analyze admin data management
 */
async function analyzeAdminDataManagement() {
  console.log('📋 Analyzing admin data management...');
  
  const adminPaths = [
    'src/app/admin',
    'src/components/admin'
  ];
  
  for (const adminPath of adminPaths) {
    if (fs.existsSync(adminPath)) {
      await analyzeFormDirectory(adminPath);
    }
  }
}

/**
 * INTELLIGENT GAP ANALYSIS
 */
async function performIntelligentGapAnalysis() {
  console.log('\n🔍 INTELLIGENT GAP ANALYSIS');
  
  // Find actual data-application mismatches
  await findRealDataApplicationGaps();
  
  // Identify missing features based on data
  await identifyMissingFeatures();
  
  // Check for data consistency issues
  await checkDataConsistency();
}

/**
 * Find real gaps between database and application
 */
async function findRealDataApplicationGaps() {
  console.log('🔍 Finding real data-application gaps...');
  
  const collections = analysisResults.databaseAnalysis.collections;
  
  // Check user-facing collections for missing UI
  Object.keys(collections).forEach(collectionName => {
    const collection = collections[collectionName];
    
    if (collection.businessRelevance === 'HIGH') {
      // Check for important fields not used in UI
      Object.keys(collection.fields).forEach(fieldName => {
        const field = collection.fields[fieldName];
        const fieldStat = collection.fieldStats[fieldName];
        
        if (fieldStat.businessImportance === 'CRITICAL' && fieldStat.populationRate > 50) {
          // This is important data - check if it's used in UI
          const isUsedInUI = checkIfFieldUsedInUI(collectionName, fieldName);
          
          if (!isUsedInUI) {
            analysisResults.criticalFindings.actualBugs.push({
              type: 'MISSING_UI_DISPLAY',
              severity: 'HIGH',
              collection: collectionName,
              field: fieldName,
              description: `Critical field '${fieldName}' in '${collectionName}' has ${fieldStat.populationRate}% population but no UI display`,
              impact: 'Users cannot see important data that exists in the system',
              recommendation: `Add UI display for ${collectionName}.${fieldName} in appropriate user interface`
            });
          }
        }
      });
    }
  });
  
  // Check form inputs for missing database storage
  Object.keys(analysisResults.applicationAnalysis.formComponents).forEach(componentPath => {
    const component = analysisResults.applicationAnalysis.formComponents[componentPath];
    
    if (component.isDataCollection) {
      component.fields.forEach(field => {
        if (field.type === 'input') {
          const hasStorage = checkIfInputHasStorage(field.name, component);
          
          if (!hasStorage) {
            analysisResults.criticalFindings.actualBugs.push({
              type: 'MISSING_DATA_STORAGE',
              severity: 'HIGH',
              component: componentPath,
              field: field.name,
              description: `Form input '${field.name}' in '${componentPath}' collects user data but has no database storage`,
              impact: 'User data is collected but lost (not persisted)',
              recommendation: `Add database field and API handling for ${field.name}`
            });
          }
        }
      });
    }
  });
}

/**
 * Check if database field is used in UI
 */
function checkIfFieldUsedInUI(collectionName, fieldName) {
  // Simple check - look for field name in form components
  const components = analysisResults.applicationAnalysis.formComponents;
  
  return Object.keys(components).some(componentPath => {
    return components[componentPath].fields.some(field => 
      field.name === fieldName || 
      field.name === fieldName.split('.').pop()
    );
  });
}

/**
 * Check if form input has database storage
 */
function checkIfInputHasStorage(inputName, component) {
  // Check if there's a corresponding API endpoint
  const apis = analysisResults.applicationAnalysis.apiEndpoints;
  
  // Look for submission endpoint
  const submissionEndpoint = component.fields.find(f => f.type === 'submission');
  if (!submissionEndpoint) return false;
  
  // Check if API handles this field
  const apiPath = Object.keys(apis).find(path => 
    path.includes(submissionEndpoint.endpoint.replace('/api/', ''))
  );
  
  if (apiPath) {
    const api = apis[apiPath];
    return api.operations.some(op => 
      op.type === 'CREATE' || op.type === 'SAVE' || op.type === 'UPDATE'
    );
  }
  
  return false;
}

/**
 * Identify missing features based on available data
 */
async function identifyMissingFeatures() {
  console.log('🔍 Identifying missing features...');
  
  const collections = analysisResults.databaseAnalysis.collections;
  
  // Check for data that could enable new features
  Object.keys(collections).forEach(collectionName => {
    const collection = collections[collectionName];
    
    // Look for underutilized data
    Object.keys(collection.fields).forEach(fieldName => {
      const fieldStat = collection.fieldStats[fieldName];
      
      if (fieldStat.businessImportance === 'IMPORTANT' && 
          fieldStat.populationRate > 30 && 
          !checkIfFieldUsedInUI(collectionName, fieldName)) {
        
        analysisResults.criticalFindings.missingFeatures.push({
          type: 'UNDERUTILIZED_DATA',
          collection: collectionName,
          field: fieldName,
          populationRate: fieldStat.populationRate,
          description: `Field '${fieldName}' has good data (${fieldStat.populationRate}% populated) but could enhance user experience`,
          opportunity: `Could display ${fieldName} to provide more information to users`
        });
      }
    });
  });
}

/**
 * Check for data consistency issues
 */
async function checkDataConsistency() {
  console.log('🔍 Checking data consistency...');
  
  const collections = analysisResults.databaseAnalysis.collections;
  
  Object.keys(collections).forEach(collectionName => {
    const collection = collections[collectionName];
    
    // Check for poor data quality in important fields
    Object.keys(collection.fields).forEach(fieldName => {
      const fieldStat = collection.fieldStats[fieldName];
      
      if (fieldStat.businessImportance === 'CRITICAL' && fieldStat.dataQuality === 'POOR') {
        analysisResults.criticalFindings.dataInconsistencies.push({
          type: 'POOR_DATA_QUALITY',
          severity: 'MEDIUM',
          collection: collectionName,
          field: fieldName,
          populationRate: fieldStat.populationRate,
          description: `Critical field '${fieldName}' has poor data quality (${fieldStat.populationRate}% populated)`,
          impact: 'May cause display issues or incomplete user experience',
          recommendation: 'Improve data collection or add validation'
        });
      }
    });
  });
}

/**
 * MAIN EXECUTION
 */
async function runRefinedAnalysis() {
  console.log('🚀 Starting Refined Bidirectional Data-Application Verification');
  console.log('=' .repeat(80));
  
  try {
    // Connect to database
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable not set');
    }
    
    console.log('🔌 Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database successfully');
    
    // Run refined analysis
    await analyzeDatabaseComprehensively();
    await analyzeApplicationIntelligently();
    await performIntelligentGapAnalysis();
    
    // Generate recommendations
    generateIntelligentRecommendations();
    
    // Save results
    const timestamp = Date.now();
    const resultsFile = `refined-analysis-${timestamp}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(analysisResults, null, 2));
    
    // Generate summary
    generateRefinedSummary(resultsFile);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

/**
 * Generate intelligent recommendations
 */
function generateIntelligentRecommendations() {
  // Immediate fixes (critical bugs)
  analysisResults.criticalFindings.actualBugs.forEach(bug => {
    if (bug.severity === 'HIGH') {
      analysisResults.recommendations.immediate.push({
        priority: 'CRITICAL',
        type: bug.type,
        description: bug.description,
        action: bug.recommendation
      });
    }
  });
  
  // Short-term improvements (missing features)
  analysisResults.criticalFindings.missingFeatures.forEach(feature => {
    analysisResults.recommendations.shortTerm.push({
      priority: 'MEDIUM',
      type: 'FEATURE_ENHANCEMENT',
      description: feature.description,
      action: feature.opportunity
    });
  });
  
  // Long-term improvements (data quality)
  analysisResults.criticalFindings.dataInconsistencies.forEach(issue => {
    analysisResults.recommendations.longTerm.push({
      priority: 'LOW',
      type: 'DATA_QUALITY',
      description: issue.description,
      action: issue.recommendation
    });
  });
}

/**
 * Generate refined summary
 */
function generateRefinedSummary(resultsFile) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 REFINED BIDIRECTIONAL ANALYSIS SUMMARY');
  console.log('='.repeat(80));
  
  // Database summary
  console.log(`\n📋 DATABASE ANALYSIS:`);
  console.log(`  Total collections: ${Object.keys(analysisResults.databaseAnalysis.collections).length}`);
  console.log(`  Total documents: ${analysisResults.databaseAnalysis.totalDocuments}`);
  console.log(`  Total fields: ${analysisResults.databaseAnalysis.totalFields}`);
  
  // Application summary
  console.log(`\n📋 APPLICATION ANALYSIS:`);
  console.log(`  Form components: ${Object.keys(analysisResults.applicationAnalysis.formComponents).length}`);
  console.log(`  API endpoints: ${Object.keys(analysisResults.applicationAnalysis.apiEndpoints).length}`);
  console.log(`  Total inputs: ${analysisResults.applicationAnalysis.totalInputs}`);
  
  // Critical findings
  console.log(`\n🚨 CRITICAL FINDINGS:`);
  console.log(`  Actual bugs: ${analysisResults.criticalFindings.actualBugs.length}`);
  console.log(`  Missing features: ${analysisResults.criticalFindings.missingFeatures.length}`);
  console.log(`  Data inconsistencies: ${analysisResults.criticalFindings.dataInconsistencies.length}`);
  
  // Show actual bugs
  if (analysisResults.criticalFindings.actualBugs.length > 0) {
    console.log(`\n🐛 ACTUAL BUGS FOUND:`);
    analysisResults.criticalFindings.actualBugs.forEach((bug, index) => {
      console.log(`  ${index + 1}. [${bug.severity}] ${bug.description}`);
      console.log(`     Impact: ${bug.impact}`);
      console.log(`     Fix: ${bug.recommendation}`);
    });
  }
  
  // Recommendations
  console.log(`\n💡 RECOMMENDATIONS:`);
  console.log(`  Immediate fixes: ${analysisResults.recommendations.immediate.length}`);
  console.log(`  Short-term improvements: ${analysisResults.recommendations.shortTerm.length}`);
  console.log(`  Long-term improvements: ${analysisResults.recommendations.longTerm.length}`);
  
  console.log(`\n📄 Full results saved to: ${resultsFile}`);
  console.log('='.repeat(80));
}

// Run the refined analysis
if (require.main === module) {
  runRefinedAnalysis();
}

module.exports = { runRefinedAnalysis };
