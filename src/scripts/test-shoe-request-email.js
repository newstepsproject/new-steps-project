// Simple test for shoe request confirmation email
const fetch = require('node-fetch');

async function testShoeRequestEmail() {
  console.log('🔍 Testing Shoe Request Confirmation Email');
  console.log('==========================================\n');
  
  // Test data that matches what the API expects
  const testData = {
    firstName: 'Test',
    requestId: 'REQ-TEST-12345',
    itemCount: 1,
    items: [
      {
        shoeId: 101,
        brand: 'Nike',
        name: 'Air Max',
        size: '10'
      }
    ],
    deliveryMethod: 'pickup',
    shippingFee: 0
  };
  
  try {
    console.log('📧 Testing email template with test data...');
    console.log('Test data:', JSON.stringify(testData, null, 2));
    
    // Test the contact form first to make sure email system is working
    console.log('\\n📧 Testing contact form email (should work)...');
    const contactResponse = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Email Test',
        email: 'xinwenzhang@gmail.com',
        subject: 'Testing Email Before Shoe Request',
        message: 'This is to test if email system is working before testing shoe request confirmation'
      })
    });
    
    const contactResult = await contactResponse.json();
    console.log('Contact form result:', contactResult);
    
    if (contactResult.success) {
      console.log('✅ Contact form email working - email system is functional');
    } else {
      console.log('❌ Contact form email failed - email system issue');
      return;
    }
    
    console.log('\\n🔍 Email system is working. The issue might be:');
    console.log('1. Shoe request confirmation email template has an error');
    console.log('2. Data being passed to template is malformed');
    console.log('3. Email was sent but went to spam folder');
    console.log('4. Error in the request API that prevented email sending');
    
    console.log('\\n📝 Check the following:');
    console.log('- Check spam folder for emails from newstepsfit@gmail.com');
    console.log('- Look at server logs when you submitted the request');
    console.log('- Check if request was actually saved to database');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testShoeRequestEmail(); 