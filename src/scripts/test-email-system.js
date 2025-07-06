const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function testEmailSystem() {
  console.log('🔍 Testing Email System Configuration');
  console.log('=====================================\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM}`);
  console.log(`EMAIL_SERVER: ${process.env.EMAIL_SERVER}`);
  console.log(`EMAIL_PORT: ${process.env.EMAIL_PORT}`);
  console.log(`EMAIL_USERNAME: ${process.env.EMAIL_USERNAME}`);
  console.log(`EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET'}\n`);
  
  // Check if using AWS SES
  const isUsingSES = process.env.EMAIL_SERVER && process.env.EMAIL_SERVER.includes('amazonaws.com');
  console.log(`📧 Email Service: ${isUsingSES ? 'AWS SES (Production)' : 'Ethereal (Development)'}\n`);
  
  if (isUsingSES) {
    console.log('✅ Using AWS SES for production email delivery');
    console.log(`📤 Sending FROM: ${process.env.EMAIL_FROM}`);
    console.log(`🌐 SMTP Server: ${process.env.EMAIL_SERVER}`);
    console.log(`🔌 Port: ${process.env.EMAIL_PORT}`);
    
    // Test the connection
    try {
      console.log('\n🔄 Testing AWS SES connection...');
      
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER,
        port: parseInt(process.env.EMAIL_PORT, 10),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      
      // Verify connection
      await transporter.verify();
      console.log('✅ AWS SES connection successful!');
      
      // Send a test email
      console.log('\n📧 Sending test email...');
      const testEmail = {
        from: process.env.EMAIL_FROM,
        to: 'xinwenzhang@gmail.com', // Replace with your email
        subject: 'New Steps Project - Email System Test',
        html: `
          <h1>Email System Test Successful! ✅</h1>
          <p>This email confirms that the New Steps Project email system is working correctly with the new email address.</p>
          <p><strong>From:</strong> ${process.env.EMAIL_FROM}</p>
          <p><strong>Service:</strong> AWS SES</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p>The email system update is complete and ready for production use!</p>
        `,
      };
      
      const info = await transporter.sendMail(testEmail);
      console.log(`✅ Test email sent successfully!`);
      console.log(`📧 Message ID: ${info.messageId}`);
      console.log(`📤 Sent from: ${process.env.EMAIL_FROM}`);
      console.log(`📥 Sent to: xinwenzhang@gmail.com`);
      
    } catch (error) {
      console.error('❌ Email test failed:', error.message);
    }
    
  } else {
    console.log('⚠️  Using Ethereal for development - AWS SES not configured');
  }
  
  console.log('\n🎯 Email System Status Summary:');
  console.log(`📧 FROM Address: ${process.env.EMAIL_FROM}`);
  console.log(`🔧 Service: ${isUsingSES ? 'AWS SES (Production)' : 'Ethereal (Development)'}`);
  console.log(`✅ Configuration: ${isUsingSES ? 'Ready for Production' : 'Development Only'}`);
}

testEmailSystem().catch(console.error); 