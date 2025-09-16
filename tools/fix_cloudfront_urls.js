#!/usr/bin/env node
/**
 * Fix CloudFront URLs to Direct S3 URLs
 * 
 * CloudFront domain d2xvhw0k6zd8h8.cloudfront.net is not resolving,
 * so we need to convert all CloudFront URLs to direct S3 URLs.
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

// Define Shoe schema (minimal for this script)
const ShoeSchema = new mongoose.Schema({
  images: [String]
}, { collection: 'shoes' });

const Shoe = mongoose.model('Shoe', ShoeSchema);

async function fixCloudFrontUrls() {
  console.log('🔧 FIXING CLOUDFRONT URLS TO DIRECT S3 URLS');
  console.log('=' * 50);
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Find all shoes with CloudFront URLs
    console.log('🔍 Finding shoes with CloudFront URLs...');
    const shoes = await Shoe.find({
      images: { $regex: 'd2xvhw0k6zd8h8.cloudfront.net' }
    });
    
    console.log(`📊 Found ${shoes.length} shoes with CloudFront URLs`);
    
    if (shoes.length === 0) {
      console.log('✅ No shoes need URL conversion');
      return;
    }
    
    // Convert URLs for each shoe
    let updatedCount = 0;
    
    for (const shoe of shoes) {
      const originalImages = [...shoe.images];
      const updatedImages = shoe.images.map(url => {
        if (url.includes('d2xvhw0k6zd8h8.cloudfront.net')) {
          // Convert CloudFront URL to direct S3 URL
          // From: https://d2xvhw0k6zd8h8.cloudfront.net/shoes/filename.jpg
          // To: https://newsteps-images.s3.us-west-2.amazonaws.com/images/shoes/filename.jpg
          
          const filename = url.split('/').pop(); // Get filename
          const s3Url = `https://newsteps-images.s3.us-west-2.amazonaws.com/images/shoes/${filename}`;
          
          console.log(`🔄 Converting: ${url}`);
          console.log(`   ➡️  To: ${s3Url}`);
          
          return s3Url;
        }
        return url;
      });
      
      // Update the shoe if URLs changed
      if (JSON.stringify(originalImages) !== JSON.stringify(updatedImages)) {
        shoe.images = updatedImages;
        await shoe.save();
        updatedCount++;
        console.log(`✅ Updated shoe ${shoe._id}`);
      }
    }
    
    console.log('');
    console.log('🎉 URL CONVERSION COMPLETE!');
    console.log(`📊 Updated ${updatedCount} shoes`);
    console.log('📝 All CloudFront URLs converted to direct S3 URLs');
    
  } catch (error) {
    console.error('❌ Error fixing CloudFront URLs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from database');
  }
}

// Run the script
fixCloudFrontUrls();
