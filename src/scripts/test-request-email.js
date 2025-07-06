const { sendEmail } = require('../lib/email.ts');

async function testRequestConfirmationEmail() {
  console.log('🔍 Testing Shoe Request Confirmation Email');
  console.log('==========================================\n');
  
  const testData = {
    firstName: 'Test',
    requestId: 'REQ-TEST-12345',
    itemCount: 2,
    items: [
      {
        shoeId: 101,
        brand: 'Nike',
        name: 'Air Max',
        size: '10',
        sport: 'Running'
      },
      {
        shoeId: 102,
        brand: 'Adidas', 
        name: 'Ultraboost',
        size: '9.5',
        sport: 'Basketball'
      }
    ],
    deliveryMethod: 'shipping',
    address: '123 Test St',
    city: 'Test City',
    state: 'CA',
    zipCode: '12345',
    shippingFee: 5
  };
  
  try {
    console.log('📧 Sending test shoe request confirmation email...');
    
    const result = await sendEmail(
      'xinwenzhang@gmail.com',
      'shoe_request_confirmation',
      testData
    );
    
    console.log('✅ Email sent successfully!');
    console.log('Message ID:', result);
    
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    console.error('Error details:', error.message);
  }
}

testRequestConfirmationEmail(); 