const { sendEmail, EmailTemplate } = require('./src/lib/email.ts');

async function testEmailSystem() {
  try {
    console.log('Testing email system...');
    
    await sendEmail(
      'test@example.com',
      EmailTemplate.SHOE_REQUEST_CONFIRMATION,
      {
        firstName: 'Test',
        requestId: 'REQ-TEST-1234',
        itemCount: 1,
        items: [{
          brand: 'Nike',
          modelName: 'Air Max',
          shoeId: 101,
          size: '10'
        }],
        deliveryMethod: 'shipping',
        address: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '12345',
        shippingFee: 5.00
      }
    );
    
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Email failed:', error.message);
  }
}

testEmailSystem();
