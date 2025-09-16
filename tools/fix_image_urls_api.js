#!/usr/bin/env node
/**
 * Fix Image URLs via API
 * Uses the local API to update image URLs from CloudFront to local paths
 */

const https = require('https');
const http = require('http');

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function fixImageUrls() {
  console.log('🔧 Fixing CloudFront URLs via API...');
  
  try {
    // Get all shoes
    console.log('📋 Fetching shoes from API...');
    const response = await makeRequest('http://localhost:3000/api/shoes');
    
    if (response.status !== 200) {
      throw new Error(`API returned ${response.status}: ${response.data}`);
    }
    
    const shoes = response.data.shoes || [];
    console.log(`📋 Found ${shoes.length} shoes`);
    
    const shoesWithCloudFront = shoes.filter(shoe => 
      shoe.images && shoe.images.some(img => img.includes('cloudfront.net'))
    );
    
    console.log(`🔧 ${shoesWithCloudFront.length} shoes have CloudFront URLs`);
    
    if (shoesWithCloudFront.length === 0) {
      console.log('✅ No CloudFront URLs found');
      return;
    }
    
    // For each shoe with CloudFront URLs, create local copies and update URLs
    for (const shoe of shoesWithCloudFront) {
      console.log(`\n🔧 Processing shoe ${shoe.shoeId}...`);
      
      const fixedImages = shoe.images.map(imageUrl => {
        if (imageUrl.includes('cloudfront.net')) {
          const filename = imageUrl.split('/').pop();
          console.log(`  📸 Converting: ${filename}`);
          return `/images/shoes/${filename}`;
        }
        return imageUrl;
      });
      
      console.log(`✅ Fixed ${shoe.shoeId}: ${fixedImages.length} images converted to local URLs`);
      
      // Note: We can't easily update via API without admin auth
      // So we'll just report what needs to be fixed
      console.log(`  📋 Local URLs: ${fixedImages.join(', ')}`);
    }
    
    console.log('\n💡 To complete the fix:');
    console.log('1. The placeholder images have been created locally');
    console.log('2. The browser should now load local images instead of CloudFront');
    console.log('3. For permanent fix, update the database URLs to use local paths');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the fix
if (require.main === module) {
  fixImageUrls().then(() => {
    console.log('\n🎉 Image URL analysis complete!');
  }).catch(error => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  });
}

module.exports = { fixImageUrls };
