#!/usr/bin/env node

/**
 * COMPREHENSIVE BIDIRECTIONAL DATA-APPLICATION VERIFICATION
 * 
 * This script implements the enhanced testing framework to identify logic bugs
 * through bidirectional verification between database and application.
 * 
 * Direction 1: Database → Application (What data exists but isn't used?)
 * Direction 2: Application → Database (What inputs exist but aren't stored?)
 */

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Enhanced analysis results
const analysisResults = {
  timestamp: new Date().toISOString(),
  databaseToApplication: {
    collections: {},
    unusedFields: [],
    missingDisplays: [],
    orphanedData: []
  },
  applicationToDatabase: {
    formInputs: {},
    missingStorage: [],
    brokenWorkflows: [],
    lostInteractions: []
  },
  bidirectionalGaps: {
    criticalBugs: [],
    functionalGaps: [],
    enhancementOpportunities: [],
    designInconsistencies: []
  },
  recommendations: {
    databaseFixes: [],
    applicationFixes: [],
    integrationFixes: [],
    newFeatures: []
  }
};

/**
 * PHASE 1: ENHANCED DATABASE ANALYSIS
 * Comprehensive mapping of all database collections and fields
 */
async function analyzeDatabaseSchema() {
  console.log('🔍 PHASE 1: Enhanced Database Schema Analysis');
  
  try {
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections`);
    
    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`\n📋 Analyzing collection: ${collectionName}`);
      
      // Get sample documents to understand schema
      const sampleDocs = await mongoose.connection.db
        .collection(collectionName)
        .find({})
        .limit(10)
        .toArray();
      
      // Get collection statistics
      const stats = await mongoose.connection.db
        .collection(collectionName)
        .stats();
      
      // Analyze field patterns
      const fieldAnalysis = analyzeFieldPatterns(sampleDocs);
      
      analysisResults.databaseToApplication.collections[collectionName] = {
        documentCount: stats.count,
        avgDocumentSize: stats.avgObjSize,
        totalSize: stats.size,
        fields: fieldAnalysis.fields,
        fieldUsageStats: fieldAnalysis.usage,
        dataQualityIssues: fieldAnalysis.qualityIssues,
        sampleDocuments: sampleDocs.slice(0, 3) // Keep first 3 for reference
      };
      
      console.log(`  📈 Documents: ${stats.count}, Fields: ${Object.keys(fieldAnalysis.fields).length}`);
    }
    
  } catch (error) {
    console.error('❌ Database analysis error:', error);
  }
}

/**
 * Analyze field patterns in documents
 */
function analyzeFieldPatterns(documents) {
  const fields = {};
  const usage = {};
  const qualityIssues = [];
  
  documents.forEach((doc, docIndex) => {
    analyzeDocumentFields(doc, '', fields, usage, qualityIssues, docIndex);
  });
  
  return { fields, usage, qualityIssues };
}

/**
 * Recursively analyze document fields
 */
function analyzeDocumentFields(obj, prefix, fields, usage, qualityIssues, docIndex) {
  if (!obj || typeof obj !== 'object') return;
  
  Object.keys(obj).forEach(key => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    
    // Initialize field tracking
    if (!fields[fullKey]) {
      fields[fullKey] = {
        type: typeof value,
        isArray: Array.isArray(value),
        isObject: value && typeof value === 'object' && !Array.isArray(value),
        examples: [],
        nullCount: 0,
        undefinedCount: 0,
        emptyCount: 0
      };
      usage[fullKey] = 0;
    }
    
    // Track usage
    usage[fullKey]++;
    
    // Analyze value
    if (value === null) {
      fields[fullKey].nullCount++;
    } else if (value === undefined) {
      fields[fullKey].undefinedCount++;
    } else if (value === '' || (Array.isArray(value) && value.length === 0)) {
      fields[fullKey].emptyCount++;
    } else {
      // Store example values (limit to 3)
      if (fields[fullKey].examples.length < 3) {
        fields[fullKey].examples.push(value);
      }
    }
    
    // Quality issue detection
    if (value === null || value === undefined || value === '') {
      qualityIssues.push({
        field: fullKey,
        issue: 'missing_value',
        documentIndex: docIndex,
        value: value
      });
    }
    
    // Recursive analysis for nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      analyzeDocumentFields(value, fullKey, fields, usage, qualityIssues, docIndex);
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      // Analyze first array element for structure
      analyzeDocumentFields(value[0], `${fullKey}[0]`, fields, usage, qualityIssues, docIndex);
    }
  });
}

/**
 * PHASE 2: APPLICATION INTERFACE ANALYSIS
 * Scan all application components for user inputs and data displays
 */
async function analyzeApplicationInterfaces() {
  console.log('\n🔍 PHASE 2: Application Interface Analysis');
  
  // Scan React components for forms and inputs
  await scanReactComponents();
  
  // Scan API endpoints for data handling
  await scanApiEndpoints();
  
  // Scan admin interfaces
  await scanAdminInterfaces();
}

/**
 * Scan React components for form inputs and data displays
 */
async function scanReactComponents() {
  console.log('📋 Scanning React components...');
  
  const componentDirs = [
    'src/app',
    'src/components',
    'src/pages'
  ];
  
  for (const dir of componentDirs) {
    if (fs.existsSync(dir)) {
      await scanDirectory(dir, analyzeReactComponent);
    }
  }
}

/**
 * Recursively scan directory for files
 */
async function scanDirectory(dirPath, analyzeFunction) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      await scanDirectory(itemPath, analyzeFunction);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts') || item.endsWith('.jsx') || item.endsWith('.js')) {
      await analyzeFunction(itemPath);
    }
  }
}

/**
 * Analyze React component for inputs and displays
 */
async function analyzeReactComponent(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Find form inputs
    const inputs = findFormInputs(content);
    if (inputs.length > 0) {
      analysisResults.applicationToDatabase.formInputs[relativePath] = inputs;
    }
    
    // Find data displays
    const displays = findDataDisplays(content);
    if (displays.length > 0) {
      if (!analysisResults.applicationToDatabase.formInputs[relativePath]) {
        analysisResults.applicationToDatabase.formInputs[relativePath] = [];
      }
      analysisResults.applicationToDatabase.formInputs[relativePath].push(...displays.map(d => ({
        type: 'display',
        ...d
      })));
    }
    
  } catch (error) {
    console.error(`❌ Error analyzing ${filePath}:`, error.message);
  }
}

/**
 * Find form inputs in React component
 */
function findFormInputs(content) {
  const inputs = [];
  
  // Input patterns
  const inputPatterns = [
    /<Input[^>]*name=["']([^"']+)["'][^>]*>/g,
    /<Textarea[^>]*name=["']([^"']+)["'][^>]*>/g,
    /<Select[^>]*name=["']([^"']+)["'][^>]*>/g,
    /useState\(\s*([^)]+)\s*\)/g,
    /const\s+\[([^,]+),\s*set[A-Z][^]]*\]\s*=\s*useState/g
  ];
  
  inputPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      inputs.push({
        type: 'input',
        name: match[1],
        pattern: match[0]
      });
    }
  });
  
  return inputs;
}

/**
 * Find data displays in React component
 */
function findDataDisplays(content) {
  const displays = [];
  
  // Display patterns (accessing object properties)
  const displayPatterns = [
    /\{([a-zA-Z_$][a-zA-Z0-9_$]*\.[a-zA-Z_$][a-zA-Z0-9_$.]*)\}/g,
    /\{([a-zA-Z_$][a-zA-Z0-9_$]*\?\.[a-zA-Z_$][a-zA-Z0-9_$.]*)\}/g
  ];
  
  displayPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      displays.push({
        type: 'display',
        expression: match[1],
        pattern: match[0]
      });
    }
  });
  
  return displays;
}

/**
 * Scan API endpoints for data handling
 */
async function scanApiEndpoints() {
  console.log('📋 Scanning API endpoints...');
  
  const apiDir = 'src/app/api';
  if (fs.existsSync(apiDir)) {
    await scanDirectory(apiDir, analyzeApiEndpoint);
  }
}

/**
 * Analyze API endpoint for data handling
 */
async function analyzeApiEndpoint(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Find database operations
    const dbOperations = findDatabaseOperations(content);
    if (dbOperations.length > 0) {
      if (!analysisResults.applicationToDatabase.formInputs[relativePath]) {
        analysisResults.applicationToDatabase.formInputs[relativePath] = [];
      }
      analysisResults.applicationToDatabase.formInputs[relativePath].push(...dbOperations);
    }
    
  } catch (error) {
    console.error(`❌ Error analyzing API ${filePath}:`, error.message);
  }
}

/**
 * Find database operations in API code
 */
function findDatabaseOperations(content) {
  const operations = [];
  
  // Database operation patterns
  const dbPatterns = [
    /\.create\(\s*\{([^}]+)\}\s*\)/g,
    /\.findOneAndUpdate\([^,]+,\s*\{([^}]+)\}/g,
    /\.updateOne\([^,]+,\s*\{([^}]+)\}/g,
    /\.save\(\)/g,
    /\.find\(\s*\{([^}]*)\}\s*\)/g
  ];
  
  dbPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      operations.push({
        type: 'database_operation',
        operation: match[0],
        fields: match[1] || 'none'
      });
    }
  });
  
  return operations;
}

/**
 * Scan admin interfaces specifically
 */
async function scanAdminInterfaces() {
  console.log('📋 Scanning admin interfaces...');
  
  const adminDir = 'src/app/admin';
  if (fs.existsSync(adminDir)) {
    await scanDirectory(adminDir, analyzeAdminComponent);
  }
  
  const adminComponentsDir = 'src/components/admin';
  if (fs.existsSync(adminComponentsDir)) {
    await scanDirectory(adminComponentsDir, analyzeAdminComponent);
  }
}

/**
 * Analyze admin component with special focus on data management
 */
async function analyzeAdminComponent(filePath) {
  // Use same analysis as regular components but flag as admin
  await analyzeReactComponent(filePath);
  
  // Mark as admin interface
  const relativePath = path.relative(process.cwd(), filePath);
  if (analysisResults.applicationToDatabase.formInputs[relativePath]) {
    analysisResults.applicationToDatabase.formInputs[relativePath].forEach(input => {
      input.isAdminInterface = true;
    });
  }
}

/**
 * PHASE 3: BIDIRECTIONAL GAP ANALYSIS
 * Cross-reference database and application to find gaps and bugs
 */
async function performBidirectionalAnalysis() {
  console.log('\n🔍 PHASE 3: Bidirectional Gap Analysis');
  
  // Direction 1: Database → Application gaps
  await findDatabaseToApplicationGaps();
  
  // Direction 2: Application → Database gaps
  await findApplicationToDatabaseGaps();
  
  // Cross-verification
  await performCrossVerification();
}

/**
 * Find database fields that aren't used in application
 */
async function findDatabaseToApplicationGaps() {
  console.log('📊 Analyzing Database → Application gaps...');
  
  const collections = analysisResults.databaseToApplication.collections;
  
  Object.keys(collections).forEach(collectionName => {
    const collection = collections[collectionName];
    
    Object.keys(collection.fields).forEach(fieldName => {
      const field = collection.fields[fieldName];
      
      // Check if field is used in application
      const isUsedInApp = isFieldUsedInApplication(collectionName, fieldName);
      
      if (!isUsedInApp && field.examples.length > 0) {
        // Field has data but isn't used in application
        analysisResults.databaseToApplication.unusedFields.push({
          collection: collectionName,
          field: fieldName,
          type: field.type,
          examples: field.examples,
          documentCount: collection.documentCount,
          severity: determineUnusedFieldSeverity(collectionName, fieldName, field)
        });
      }
    });
  });
  
  console.log(`  📋 Found ${analysisResults.databaseToApplication.unusedFields.length} unused database fields`);
}

/**
 * Check if a database field is used in the application
 */
function isFieldUsedInApplication(collectionName, fieldName) {
  const formInputs = analysisResults.applicationToDatabase.formInputs;
  
  // Simple field name matching (can be enhanced)
  const fieldBaseName = fieldName.split('.').pop(); // Get last part of nested field
  
  for (const filePath in formInputs) {
    const inputs = formInputs[filePath];
    
    for (const input of inputs) {
      if (input.type === 'display' && input.expression) {
        // Check if field is displayed
        if (input.expression.includes(fieldBaseName)) {
          return true;
        }
      }
      
      if (input.type === 'input' && input.name) {
        // Check if field is used as input
        if (input.name === fieldBaseName || input.name === fieldName) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Determine severity of unused field
 */
function determineUnusedFieldSeverity(collectionName, fieldName, field) {
  // High severity: User-facing collections with populated fields
  const userFacingCollections = ['users', 'shoes', 'donations', 'shoerequests', 'moneydonations'];
  const importantFields = ['name', 'email', 'status', 'notes', 'referenceId'];
  
  if (userFacingCollections.includes(collectionName.toLowerCase()) && 
      importantFields.some(f => fieldName.toLowerCase().includes(f))) {
    return 'HIGH';
  }
  
  // Medium severity: Collections with good data coverage
  if (field.examples.length > 0 && field.nullCount < field.examples.length) {
    return 'MEDIUM';
  }
  
  return 'LOW';
}

/**
 * Find application inputs that aren't stored in database
 */
async function findApplicationToDatabaseGaps() {
  console.log('📊 Analyzing Application → Database gaps...');
  
  const formInputs = analysisResults.applicationToDatabase.formInputs;
  
  Object.keys(formInputs).forEach(filePath => {
    const inputs = formInputs[filePath];
    
    inputs.forEach(input => {
      if (input.type === 'input' && input.name) {
        // Check if input is stored in database
        const isStoredInDb = isInputStoredInDatabase(input.name);
        
        if (!isStoredInDb) {
          analysisResults.applicationToDatabase.missingStorage.push({
            file: filePath,
            inputName: input.name,
            inputType: input.type,
            isAdminInterface: input.isAdminInterface || false,
            severity: determineMissingStorageSeverity(filePath, input)
          });
        }
      }
    });
  });
  
  console.log(`  📋 Found ${analysisResults.applicationToDatabase.missingStorage.length} inputs without database storage`);
}

/**
 * Check if an application input is stored in database
 */
function isInputStoredInDatabase(inputName) {
  const collections = analysisResults.databaseToApplication.collections;
  
  Object.keys(collections).forEach(collectionName => {
    const collection = collections[collectionName];
    
    // Check if any field matches the input name
    if (Object.keys(collection.fields).some(fieldName => 
        fieldName === inputName || 
        fieldName.endsWith(`.${inputName}`) ||
        fieldName.split('.').pop() === inputName)) {
      return true;
    }
  });
  
  return false;
}

/**
 * Determine severity of missing storage
 */
function determineMissingStorageSeverity(filePath, input) {
  // High severity: User data inputs
  const userDataInputs = ['email', 'name', 'phone', 'address', 'notes'];
  
  if (userDataInputs.some(field => input.name.toLowerCase().includes(field))) {
    return 'HIGH';
  }
  
  // Medium severity: Admin interfaces
  if (input.isAdminInterface) {
    return 'MEDIUM';
  }
  
  return 'LOW';
}

/**
 * Perform cross-verification between directions
 */
async function performCrossVerification() {
  console.log('🔄 Performing cross-verification...');
  
  // Classify gaps as bugs or design decisions
  classifyGapsAsBugs();
  
  // Generate recommendations
  generateRecommendations();
}

/**
 * Classify identified gaps as actual bugs vs intentional design
 */
function classifyGapsAsBugs() {
  // Critical bugs: High severity gaps that likely represent actual bugs
  analysisResults.databaseToApplication.unusedFields
    .filter(field => field.severity === 'HIGH')
    .forEach(field => {
      analysisResults.bidirectionalGaps.criticalBugs.push({
        type: 'unused_database_field',
        description: `Database field '${field.field}' in '${field.collection}' has data but is not displayed in UI`,
        collection: field.collection,
        field: field.field,
        impact: 'Users cannot see important data that exists in database',
        recommendation: 'Add UI display for this field or remove if truly unused'
      });
    });
  
  analysisResults.applicationToDatabase.missingStorage
    .filter(input => input.severity === 'HIGH')
    .forEach(input => {
      analysisResults.bidirectionalGaps.criticalBugs.push({
        type: 'missing_database_storage',
        description: `Application input '${input.inputName}' in '${input.file}' is not stored in database`,
        file: input.file,
        input: input.inputName,
        impact: 'User data is collected but lost (not persisted)',
        recommendation: 'Add database storage for this input or remove if not needed'
      });
    });
  
  // Functional gaps: Medium severity issues
  analysisResults.databaseToApplication.unusedFields
    .filter(field => field.severity === 'MEDIUM')
    .forEach(field => {
      analysisResults.bidirectionalGaps.functionalGaps.push({
        type: 'underutilized_data',
        description: `Database field '${field.field}' could enhance UI but is not used`,
        collection: field.collection,
        field: field.field,
        opportunity: 'Could improve user experience by displaying this data'
      });
    });
  
  // Enhancement opportunities: Low severity items
  analysisResults.databaseToApplication.unusedFields
    .filter(field => field.severity === 'LOW')
    .forEach(field => {
      analysisResults.bidirectionalGaps.enhancementOpportunities.push({
        type: 'potential_feature',
        description: `Database field '${field.field}' could be basis for new feature`,
        collection: field.collection,
        field: field.field,
        potential: 'Could be developed into new functionality'
      });
    });
}

/**
 * Generate specific recommendations for fixes
 */
function generateRecommendations() {
  // Database fixes
  analysisResults.bidirectionalGaps.criticalBugs
    .filter(bug => bug.type === 'unused_database_field')
    .forEach(bug => {
      analysisResults.recommendations.applicationFixes.push({
        priority: 'HIGH',
        type: 'add_ui_display',
        description: `Add UI display for ${bug.collection}.${bug.field}`,
        file: `Find appropriate component to display ${bug.field}`,
        action: `Add display of ${bug.field} in relevant UI component`
      });
    });
  
  // Application fixes
  analysisResults.bidirectionalGaps.criticalBugs
    .filter(bug => bug.type === 'missing_database_storage')
    .forEach(bug => {
      analysisResults.recommendations.databaseFixes.push({
        priority: 'HIGH',
        type: 'add_database_field',
        description: `Add database storage for ${bug.input}`,
        collection: 'Determine appropriate collection',
        action: `Add ${bug.input} field to database schema and update API`
      });
    });
}

/**
 * MAIN EXECUTION
 */
async function runBidirectionalAnalysis() {
  console.log('🚀 Starting Enhanced Bidirectional Data-Application Verification');
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
    
    // Run analysis phases
    await analyzeDatabaseSchema();
    await analyzeApplicationInterfaces();
    await performBidirectionalAnalysis();
    
    // Save results
    const timestamp = Date.now();
    const resultsFile = `bidirectional-analysis-${timestamp}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify(analysisResults, null, 2));
    
    // Generate summary report
    generateSummaryReport(resultsFile);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

/**
 * Generate human-readable summary report
 */
function generateSummaryReport(resultsFile) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 BIDIRECTIONAL ANALYSIS SUMMARY REPORT');
  console.log('='.repeat(80));
  
  // Database analysis summary
  const collections = Object.keys(analysisResults.databaseToApplication.collections);
  console.log(`\n📋 DATABASE ANALYSIS:`);
  console.log(`  Collections analyzed: ${collections.length}`);
  collections.forEach(name => {
    const collection = analysisResults.databaseToApplication.collections[name];
    console.log(`    ${name}: ${collection.documentCount} documents, ${Object.keys(collection.fields).length} fields`);
  });
  
  // Application analysis summary
  const formFiles = Object.keys(analysisResults.applicationToDatabase.formInputs);
  console.log(`\n📋 APPLICATION ANALYSIS:`);
  console.log(`  Files analyzed: ${formFiles.length}`);
  
  // Gap analysis summary
  console.log(`\n🔍 GAP ANALYSIS:`);
  console.log(`  Unused database fields: ${analysisResults.databaseToApplication.unusedFields.length}`);
  console.log(`  Missing storage for inputs: ${analysisResults.applicationToDatabase.missingStorage.length}`);
  
  // Bug classification summary
  console.log(`\n🐛 BUG CLASSIFICATION:`);
  console.log(`  Critical bugs: ${analysisResults.bidirectionalGaps.criticalBugs.length}`);
  console.log(`  Functional gaps: ${analysisResults.bidirectionalGaps.functionalGaps.length}`);
  console.log(`  Enhancement opportunities: ${analysisResults.bidirectionalGaps.enhancementOpportunities.length}`);
  
  // Recommendations summary
  console.log(`\n💡 RECOMMENDATIONS:`);
  console.log(`  Database fixes: ${analysisResults.recommendations.databaseFixes.length}`);
  console.log(`  Application fixes: ${analysisResults.recommendations.applicationFixes.length}`);
  
  // Critical bugs detail
  if (analysisResults.bidirectionalGaps.criticalBugs.length > 0) {
    console.log(`\n🚨 CRITICAL BUGS FOUND:`);
    analysisResults.bidirectionalGaps.criticalBugs.forEach((bug, index) => {
      console.log(`  ${index + 1}. ${bug.description}`);
      console.log(`     Impact: ${bug.impact}`);
      console.log(`     Recommendation: ${bug.recommendation}`);
    });
  }
  
  console.log(`\n📄 Full results saved to: ${resultsFile}`);
  console.log('='.repeat(80));
}

// Run the analysis
if (require.main === module) {
  runBidirectionalAnalysis();
}

module.exports = {
  runBidirectionalAnalysis,
  analyzeDatabaseSchema,
  analyzeApplicationInterfaces,
  performBidirectionalAnalysis
};
