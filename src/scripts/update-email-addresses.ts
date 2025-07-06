import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Import the settings model
import SettingsModel from '@/models/settings';

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
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
        { value: update.value },
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