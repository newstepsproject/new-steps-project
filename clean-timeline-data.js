#!/usr/bin/env node

const mongoose = require('mongoose');

// Settings model schema
const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now }
});

const SettingsModel = mongoose.model('Settings', settingsSchema);

async function cleanTimelineData() {
  try {
    // Connect to production database
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://newstepsfit:pAGHNe3%21BKCLdt6@prod-newsteps.mitvzgd.mongodb.net/newsteps?retryWrites=true&w=majority&appName=prod-newsteps';
    
    console.log('🔍 Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Get current ourStory
    const ourStoryRecord = await SettingsModel.findOne({ key: 'ourStory' });
    
    if (!ourStoryRecord) {
      console.log('❌ No ourStory record found in database');
      return;
    }
    
    console.log('📊 Current ourStory items:', ourStoryRecord.value.length);
    ourStoryRecord.value.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.title} (order: ${item.order})`);
    });
    
    // Clean timeline data - keep only the main 3 items
    const cleanTimeline = [
      {
        id: 'timeline-1',
        title: 'The Beginning (2023)',
        description: 'New Steps was founded by Walter Zhang after noticing the large number of perfectly usable sports shoes being discarded while many student athletes couldn\'t afford the equipment they needed. What started as a small community initiative in San Ramon quickly grew into something bigger.',
        order: 1,
      },
      {
        id: 'timeline-2',
        title: 'Growing Our Impact (2024)',
        description: 'As word spread, more volunteers joined our cause, and we expanded our operations to serve the entire Bay Area. We partnered with local schools, sports clubs, and community organizations to reach more athletes in need. Our network of donors and recipients expanded dramatically.',
        order: 2,
      },
      {
        id: 'timeline-3',
        title: 'Today & Beyond (2025)',
        description: 'Today, New Steps continues to grow, with hundreds of shoes donated and matched with athletes across California. Our vision is to expand nationwide, creating a sustainable ecosystem of sports equipment sharing that benefits communities and the environment. We\'re constantly innovating our processes to make donating and receiving shoes as seamless as possible.',
        order: 3,
      },
    ];
    
    console.log('\n🧹 Cleaning timeline data - keeping only main 3 items...');
    
    await SettingsModel.updateOne(
      { key: 'ourStory' },
      { 
        value: cleanTimeline,
        updatedAt: new Date()
      }
    );
    
    console.log('✅ Timeline data cleaned successfully');
    
    // Verify the update
    const updatedRecord = await SettingsModel.findOne({ key: 'ourStory' });
    console.log('\n📊 Updated ourStory items:', updatedRecord.value.length);
    updatedRecord.value.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.title} (order: ${item.order})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

cleanTimelineData();
