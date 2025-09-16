#!/usr/bin/env node
/**
 * Fix Development Image URLs
 * Converts CloudFront URLs to local URLs for development environment
 */

const { MongoClient } = require('mongodb');

// Development MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://newstepsproject:Ey8pDqMhgzJJhFhf@cluster0.iqh9x.mongodb.net/newsteps-dev?retryWrites=true&w=majority';

async function fixImageUrls() {
  console.log('🔧 Fixing CloudFront URLs to local URLs for development...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const shoesCollection = db.collection('shoes');
    
    // Find all shoes with CloudFront URLs
    const shoesWithCloudFrontUrls = await shoesCollection.find({
      images: { $regex: /cloudfront\.net/ }
    }).toArray();
    
    console.log(`📋 Found ${shoesWithCloudFrontUrls.length} shoes with CloudFront URLs`);
    
    if (shoesWithCloudFrontUrls.length === 0) {
      console.log('✅ No CloudFront URLs found, nothing to fix');
      return;
    }
    
    let fixedCount = 0;
    
    for (const shoe of shoesWithCloudFrontUrls) {
      const originalImages = shoe.images;
      const fixedImages = originalImages.map(imageUrl => {
        if (imageUrl.includes('cloudfront.net')) {
          // Extract filename from CloudFront URL
          const filename = imageUrl.split('/').pop();
          // Convert to local URL
          return `/images/shoes/${filename}`;
        }
        return imageUrl;
      });
      
      // Update the shoe with fixed URLs
      await shoesCollection.updateOne(
        { _id: shoe._id },
        { $set: { images: fixedImages } }
      );
      
      console.log(`✅ Fixed shoe ${shoe.shoeId || shoe._id}: ${originalImages.length} images`);
      fixedCount++;
    }
    
    console.log(`🎉 Successfully fixed ${fixedCount} shoes`);
    
    // Verify the fix
    const remainingCloudFrontUrls = await shoesCollection.countDocuments({
      images: { $regex: /cloudfront\.net/ }
    });
    
    if (remainingCloudFrontUrls === 0) {
      console.log('✅ All CloudFront URLs have been converted to local URLs');
    } else {
      console.log(`⚠️  ${remainingCloudFrontUrls} shoes still have CloudFront URLs`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing image URLs:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Also fix any other collections that might have CloudFront URLs
async function fixAllImageUrls() {
  console.log('🔧 COMPREHENSIVE IMAGE URL FIX FOR DEVELOPMENT');
  console.log('=' * 50);
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Collections that might have image URLs
    const collections = [
      { name: 'shoes', field: 'images' },
      { name: 'donations', field: 'images' },
      { name: 'users', field: 'profileImage' }
    ];
    
    for (const { name, field } of collections) {
      console.log(`\n📋 Checking ${name} collection...`);
      
      const collection = db.collection(name);
      const query = {};
      query[field] = { $regex: /cloudfront\.net/ };
      
      const docs = await collection.find(query).toArray();
      
      if (docs.length === 0) {
        console.log(`✅ No CloudFront URLs found in ${name}`);
        continue;
      }
      
      console.log(`🔧 Fixing ${docs.length} documents in ${name}`);
      
      for (const doc of docs) {
        const update = {};
        
        if (Array.isArray(doc[field])) {
          // Handle array of images
          update[field] = doc[field].map(url => {
            if (typeof url === 'string' && url.includes('cloudfront.net')) {
              const filename = url.split('/').pop();
              return `/images/shoes/${filename}`;
            }
            return url;
          });
        } else if (typeof doc[field] === 'string' && doc[field].includes('cloudfront.net')) {
          // Handle single image URL
          const filename = doc[field].split('/').pop();
          update[field] = `/images/shoes/${filename}`;
        }
        
        if (Object.keys(update).length > 0) {
          await collection.updateOne({ _id: doc._id }, { $set: update });
          console.log(`✅ Fixed ${name} document ${doc._id}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error in comprehensive fix:', error);
  } finally {
    await client.close();
  }
}

// Run the fix
if (require.main === module) {
  fixAllImageUrls().then(() => {
    console.log('\n🎉 Image URL fix complete!');
    console.log('💡 Restart your development server to see the changes');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  });
}

module.exports = { fixImageUrls, fixAllImageUrls };
