const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Settings schema
const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  category: { type: String, default: 'general' },
  description: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

const SettingsModel = mongoose.model('Settings', settingsSchema);

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function updateEmailAddresses() {
  console.log('🔄 Updating email addresses in database...');
  
  const emailUpdates = [
    { key: 'projectEmail', value: 'newstepsfit@gmail.com' },
    { key: 'contactEmail', value: 'newstepsfit@gmail.com' },
    { key: 'supportEmail', value: 'newstepsfit@gmail.com' },
    { key: 'donationsEmail', value: 'newstepsfit@gmail.com' }
  ];

  for (const update of emailUpdates) {
    try {
      await SettingsModel.findOneAndUpdate(
        { key: update.key },
        { value: update.value, updatedAt: new Date() },
        { upsert: true, new: true }
      );
      console.log(`✅ Updated ${update.key} to ${update.value}`);
    } catch (error) {
      console.error(`❌ Failed to update ${update.key}:`, error);
    }
  }
}

async function main() {
  await connectDB();
  await updateEmailAddresses();
  
  console.log('\n✅ Email address update completed!');
  console.log('🔄 Please restart your development server to apply changes.');
  
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(console.error); 