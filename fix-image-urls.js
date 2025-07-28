const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.production' });

async function fixImageUrls() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    
    // Connect to MongoDB using production URI
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');

    // Get the shoes collection directly
    const shoesCollection = mongoose.connection.db.collection('shoes');
    
    // Find shoes with /images/general/ URLs
    const brokenShoes = await shoesCollection.find({
      images: { $regex: '/images/general/' }
    }).toArray();
    
    console.log(`📊 Found ${brokenShoes.length} shoes with broken /images/general/ URLs`);
    
    // Fix each broken shoe URL
    for (const shoe of brokenShoes) {
      console.log(`\n🔨 Fixing shoe ID ${shoe.shoeId}:`);
      
      const oldImages = shoe.images;
      const newImages = shoe.images.map(url => {
        if (url.includes('/images/general/')) {
          const newUrl = url.replace('/images/general/', '/images/shoes/');
          console.log(`  ➤ ${url} → ${newUrl}`);
          return newUrl;
        }
        return url;
      });
      
      // Update the shoe in database
      const updateResult = await shoesCollection.updateOne(
        { _id: shoe._id },
        {
          $set: {
            images: newImages,
            lastUpdated: new Date()
          }
        }
      );
      
      console.log(`  ✅ Updated! Modified count: ${updateResult.modifiedCount}`);
    }
    
    console.log(`\n🎉 SUCCESS: Fixed ${brokenShoes.length} shoes with broken image URLs!`);
    
  } catch (error) {
    console.error('❌ Error fixing image URLs:', error);
  } finally {
    // Close the connection
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the fix
fixImageUrls(); 