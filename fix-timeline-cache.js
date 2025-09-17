#!/usr/bin/env node

const mongoose = require('mongoose');

// Settings model schema
const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now }
});

const SettingsModel = mongoose.model('Settings', settingsSchema);

async function fixTimelineCache() {
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
    
    // Force cache invalidation by updating the updatedAt timestamp
    console.log('\n🔄 Forcing cache invalidation by updating timestamp...');
    
    await SettingsModel.updateOne(
      { key: 'ourStory' },
      { updatedAt: new Date() }
    );
    
    console.log('✅ Timeline cache invalidation completed');
    
    // Also call the production API to clear server-side cache
    console.log('\n🌐 Testing production about page after cache clear...');
    
    const https = require('https');
    const { URL } = require('url');
    
    // Make request to production about page to trigger fresh data fetch
    const aboutUrl = new URL('https://newsteps.fit/about');
    
    const options = {
      hostname: aboutUrl.hostname,
      port: aboutUrl.port || 443,
      path: aboutUrl.pathname,
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📄 About page response status:', res.statusCode);
        
        // Check for timeline items in response
        const timelineItems = [
          'The Beginning (2023)',
          'Growing Our Impact (2024)', 
          'Today & Beyond (2025)'
        ];
        
        let foundItems = 0;
        timelineItems.forEach(item => {
          if (data.includes(item)) {
            console.log(`   ✅ Found: ${item}`);
            foundItems++;
          } else {
            console.log(`   ❌ Missing: ${item}`);
          }
        });
        
        console.log(`\n📊 Timeline items found: ${foundItems}/${timelineItems.length}`);
        
        if (foundItems === timelineItems.length) {
          console.log('🎉 SUCCESS: All timeline items now appear on production!');
        } else {
          console.log('⚠️  ISSUE: Some timeline items still missing. May need server restart.');
        }
        
        mongoose.disconnect();
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error testing about page:', error.message);
      mongoose.disconnect();
    });
    
    req.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
  }
}

fixTimelineCache();
