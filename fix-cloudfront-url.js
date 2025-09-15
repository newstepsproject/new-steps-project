#!/usr/bin/env node

const { MongoClient } = require('mongodb');

async function fixCloudFrontUrl() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://newstepsfit:pAGHNe3%21BKCLdt6@dev-newsteps.mitvzgd.mongodb.net/newsteps?retryWrites=true&w=majority&appName=dev-newsteps";
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('newsteps');
    const shoes = db.collection('shoes');
    
    // Find shoes with CloudFront URLs
    const cloudFrontShoes = await shoes.find({
      images: { $elemMatch: { $regex: 'd2xvhw0k6zd8h8.cloudfront.net' } }
    }).toArray();
    
    console.log(`🔍 Found ${cloudFrontShoes.length} shoes with CloudFront URLs`);
    
    for (const shoe of cloudFrontShoes) {
      console.log(`📝 Fixing shoe ID ${shoe.shoeId}: ${shoe.images.join(', ')}`);
      
      // Convert CloudFront URLs to direct S3 URLs
      const updatedImages = shoe.images.map(url => {
        if (url.includes('d2xvhw0k6zd8h8.cloudfront.net')) {
          // Extract the path after the domain
          const path = url.split('d2xvhw0k6zd8h8.cloudfront.net')[1];
          return `https://newsteps-images.s3.us-west-2.amazonaws.com${path}`;
        }
        return url;
      });
      
      await shoes.updateOne(
        { _id: shoe._id },
        { $set: { images: updatedImages } }
      );
      
      console.log(`✅ Updated shoe ID ${shoe.shoeId} to use direct S3 URLs`);
      console.log(`   New URLs: ${updatedImages.join(', ')}`);
    }
    
    console.log('🎉 All CloudFront URLs converted to direct S3!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

fixCloudFrontUrl();
