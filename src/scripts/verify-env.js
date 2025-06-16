// Script to update and verify the MongoDB URI
const fs = require('fs');
const path = require('path');

const envFilePath = path.resolve(process.cwd(), '.env.local');

// Read the current .env.local file
console.log('Reading current .env.local file...');
const currentContent = fs.readFileSync(envFilePath, 'utf8');
console.log('Current content:', currentContent);

// The correct MongoDB URI
const correctUri = 'mongodb+srv://walterzhang10:ECOWetQbPSA9ySxy@newsteps-db.q6powgg.mongodb.net/newsteps?retryWrites=true&w=majority';

// Update the MongoDB URI in the file content
console.log('Updating the MongoDB URI...');
const updatedContent = currentContent.replace(
  /MONGODB_URI=.*/,
  `MONGODB_URI=${correctUri}`
);

// Write the updated content back to the file
fs.writeFileSync(envFilePath, updatedContent, 'utf8');
console.log('File updated successfully!');

// Verify the update
const newContent = fs.readFileSync(envFilePath, 'utf8');
console.log('New content:', newContent);

// Check if the URI is now correct
if (newContent.includes(correctUri)) {
  console.log('✅ MongoDB URI updated successfully!');
} else {
  console.log('❌ MongoDB URI update failed!');
}

console.log('\nDone!'); 