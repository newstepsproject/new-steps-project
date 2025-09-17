#!/usr/bin/env node

const mongoose = require('mongoose');

// Settings model schema
const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now }
});

const SettingsModel = mongoose.model('Settings', settingsSchema);

async function debugTimelineIssue() {
  try {
    // Connect to production database
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable not set');
    }
    
    console.log('🔍 Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Check all settings
    console.log('\n📊 All settings in database:');
    const allSettings = await SettingsModel.find({}).lean();
    allSettings.forEach(setting => {
      console.log(`  ${setting.key}: ${typeof setting.value} (${Array.isArray(setting.value) ? setting.value.length + ' items' : 'single value'})`);
      
      if (setting.key === 'ourStory') {
        console.log('    ourStory details:', JSON.stringify(setting.value, null, 2));
      }
    });
    
    // Check if ourStory exists
    const ourStoryRecord = await SettingsModel.findOne({ key: 'ourStory' });
    console.log('\n🔍 ourStory record:', ourStoryRecord ? 'EXISTS' : 'NOT FOUND');
    
    if (ourStoryRecord) {
      console.log('ourStory value:', JSON.stringify(ourStoryRecord.value, null, 2));
    }
    
    // Test the default settings merge logic
    console.log('\n🧪 Testing default settings merge logic...');
    
    const defaultTimeline = [
      {
        id: 'timeline-1',
        title: 'The Beginning (2023)',
        description: 'New Steps was founded by Walter Zhang...',
        order: 1,
      },
      {
        id: 'timeline-2',
        title: 'Growing Our Impact (2024)',
        description: 'As word spread, more volunteers joined...',
        order: 2,
      },
      {
        id: 'timeline-3',
        title: 'Today & Beyond (2025)',
        description: 'Today, New Steps continues to grow...',
        order: 3,
      },
    ];
    
    // Simulate the merge logic from settings.ts
    const dbSettings = {};
    allSettings.forEach(record => {
      dbSettings[record.key] = record.value;
    });
    
    const defaultSettings = { ourStory: defaultTimeline };
    const mergedSettings = { ...defaultSettings, ...dbSettings };
    
    console.log('Default timeline items:', defaultSettings.ourStory.length);
    console.log('DB timeline items:', dbSettings.ourStory?.length || 'undefined');
    console.log('Merged timeline items:', mergedSettings.ourStory?.length || 'undefined');
    
    if (mergedSettings.ourStory) {
      mergedSettings.ourStory.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title}`);
      });
    }
    
    // Check if there's an empty array in the database
    if (dbSettings.ourStory && Array.isArray(dbSettings.ourStory) && dbSettings.ourStory.length === 0) {
      console.log('\n❌ PROBLEM FOUND: Database has empty ourStory array, overriding defaults!');
      console.log('💡 Solution: Remove the empty ourStory record from database or populate it');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

debugTimelineIssue();
