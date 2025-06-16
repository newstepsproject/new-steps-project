// Script to check environment variables and test MongoDB connection
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');

// Load environment variables from .env.local
const envFilePath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading environment variables from: ${envFilePath}`);

if (fs.existsSync(envFilePath)) {
  console.log('File exists, loading...');
  const envConfig = dotenv.parse(fs.readFileSync(envFilePath));
  
  // Print the loaded variables
  console.log('\nEnvironment variables from .env.local:');
  console.log('USE_MEMORY_DB:', envConfig.USE_MEMORY_DB);
  console.log('MONGODB_URI:', envConfig.MONGODB_URI);
  
  // Test connection with the loaded MongoDB URI
  async function testConnection(uri) {
    console.log('\nTesting connection with URI from .env.local...');
    try {
      const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 10000,
      });
      
      await client.connect();
      console.log('✅ Connection successful!');
      const db = client.db();
      console.log(`Connected to database: ${db.databaseName}`);
      await client.close();
      console.log('Connection closed.');
      return true;
    } catch (error) {
      console.error('❌ Connection failed:', error);
      return false;
    }
  }
  
  // Run the test
  testConnection(envConfig.MONGODB_URI)
    .then(success => {
      if (success) {
        console.log('\n✅ Test with .env.local URI PASSED');
      } else {
        console.log('\n❌ Test with .env.local URI FAILED');
      }
      
      // Test with hardcoded URI for comparison
      const hardcodedUri = "mongodb+srv://walterzhang10:ECOWetQbPSA9ySxy@newsteps-db.q6powgg.mongodb.net/newsteps?retryWrites=true&w=majority&appName=newsteps-db";
      console.log('\nTesting with hardcoded URI for comparison...');
      
      return testConnection(hardcodedUri).then(hardcodedSuccess => {
        if (hardcodedSuccess) {
          console.log('\n✅ Test with hardcoded URI PASSED');
        } else {
          console.log('\n❌ Test with hardcoded URI FAILED');
        }
        
        // Compare URIs
        console.log('\nComparing URIs:');
        console.log('Are they exactly the same?', envConfig.MONGODB_URI === hardcodedUri);
        if (envConfig.MONGODB_URI !== hardcodedUri) {
          console.log('Length of .env.local URI:', envConfig.MONGODB_URI.length);
          console.log('Length of hardcoded URI:', hardcodedUri.length);
          
          // Check character by character
          for (let i = 0; i < Math.max(envConfig.MONGODB_URI.length, hardcodedUri.length); i++) {
            if (envConfig.MONGODB_URI[i] !== hardcodedUri[i]) {
              console.log(`Difference at position ${i}:`);
              console.log(`.env.local: '${envConfig.MONGODB_URI.substring(i-5, i)}[${envConfig.MONGODB_URI[i] || ''}]${envConfig.MONGODB_URI.substring(i+1, i+6)}'`);
              console.log(`hardcoded: '${hardcodedUri.substring(i-5, i)}[${hardcodedUri[i] || ''}]${hardcodedUri.substring(i+1, i+6)}'`);
            }
          }
        }
      });
    })
    .catch(err => {
      console.error('Error in test:', err);
    });
} else {
  console.error('.env.local file not found!');
} 