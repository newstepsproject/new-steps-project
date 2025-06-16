// Script to print out exact environment variables for debugging
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('=== Exact Environment Variables ===');
console.log('USE_MEMORY_DB:', process.env.USE_MEMORY_DB);
console.log('TEST_MODE:', process.env.TEST_MODE);
console.log('MONGODB_URI:', process.env.MONGODB_URI);

// Hardcoded URI for comparison
const hardcodedURI = "mongodb+srv://walterzhang10:ECOWetQbPSA9ySxy@newsteps-db.q6powgg.mongodb.net/newsteps?retryWrites=true&w=majority";

console.log('\n=== Hardcoded URI for comparison ===');
console.log(hardcodedURI);

// Check if they are exactly the same
console.log('\n=== Comparison ===');
console.log('Are URIs exactly the same?', process.env.MONGODB_URI === hardcodedURI);
if (process.env.MONGODB_URI !== hardcodedURI) {
  console.log('Differences:');
  
  // Length check
  console.log('- Length: env =', process.env.MONGODB_URI.length, 'hardcoded =', hardcodedURI.length);
  
  // Character by character comparison
  for (let i = 0; i < Math.max(process.env.MONGODB_URI.length, hardcodedURI.length); i++) {
    if (process.env.MONGODB_URI[i] !== hardcodedURI[i]) {
      console.log(`- Difference at position ${i}:`);
      console.log(`  env: ${process.env.MONGODB_URI.substring(Math.max(0, i-5), i)}[${process.env.MONGODB_URI[i] || 'undefined'}]${process.env.MONGODB_URI.substring(i+1, i+6)}`);
      console.log(`  hc:  ${hardcodedURI.substring(Math.max(0, i-5), i)}[${hardcodedURI[i] || 'undefined'}]${hardcodedURI.substring(i+1, i+6)}`);
    }
  }
} 