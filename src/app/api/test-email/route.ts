import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, EmailTemplate } from '@/lib/email';

export async function GET() {
  try {
    console.log('🧪 Testing email system...');
    
    // Test email configuration
    const emailConfig = {
      from: process.env.EMAIL_FROM,
      server: process.env.EMAIL_SERVER,
      port: process.env.EMAIL_PORT,
      username: process.env.EMAIL_USERNAME ? 'SET' : 'NOT SET',
      password: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET'
    };
    
    console.log('Email config:', emailConfig);
    
    // Test sending an email
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
    
    return NextResponse.json({
      success: true,
      message: 'Email test completed successfully',
      config: emailConfig
    });
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      config: {
        from: process.env.EMAIL_FROM,
        server: process.env.EMAIL_SERVER,
        port: process.env.EMAIL_PORT,
        username: process.env.EMAIL_USERNAME ? 'SET' : 'NOT SET',
        password: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET'
      }
    }, { status: 500 });
  }
}
