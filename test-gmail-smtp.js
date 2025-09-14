#!/usr/bin/env node

/**
 * Test Gmail SMTP for New Steps Project
 * Using the app password: hmur irbk apou eftc
 */

const nodemailer = require('nodemailer');

// Gmail SMTP Configuration
const gmailConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'newstepsfit@gmail.com',
    pass: 'hmur irbk apou eftc'
  },
  tls: {
    rejectUnauthorized: false
  }
};

// Create transporter
const transporter = nodemailer.createTransport(gmailConfig);

async function testGmailSMTP() {
  console.log('🧪 **TESTING GMAIL SMTP FOR NEW STEPS PROJECT**');
  console.log('================================================');
  console.log('');
  
  try {
    // Test 1: Verify connection
    console.log('🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('   ✅ Gmail SMTP connection verified successfully');
    
    // Test 2: Send test email
    console.log('\\n📧 Sending test email...');
    
    const testEmail = {
      from: {
        name: 'New Steps Project',
        address: 'newstepsfit@gmail.com'
      },
      to: 'walterzhang10@gmail.com', // Your personal email from credentials
      subject: 'New Steps Project - Gmail SMTP Test ✅',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🎉 Gmail SMTP is Working!</h2>
          
          <p>Congratulations! Your Gmail SMTP setup for New Steps Project is working perfectly.</p>
          
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0; color: #1e40af;">✅ Configuration Verified:</h3>
            <ul style="margin: 10px 0;">
              <li>SMTP Server: smtp.gmail.com:587</li>
              <li>Authentication: App Password</li>
              <li>From Address: newstepsfit@gmail.com</li>
              <li>TLS Encryption: Enabled</li>
            </ul>
          </div>
          
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0; color: #166534;">📊 Email Capacity:</h3>
            <ul style="margin: 10px 0;">
              <li><strong>Daily Limit:</strong> 500 emails/day</li>
              <li><strong>Your Estimated Usage:</strong> 16-200 emails/day</li>
              <li><strong>Headroom:</strong> Plenty of capacity for growth!</li>
            </ul>
          </div>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Deploy this configuration to production</li>
            <li>Test donation confirmation emails</li>
            <li>Test shoe request confirmations</li>
            <li>Monitor email delivery rates</li>
          </ol>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #6b7280;">
            New Steps Project - Giving new life to old kicks<br>
            <a href="https://newsteps.fit">newsteps.fit</a>
          </p>
        </div>
      `,
      text: `
Gmail SMTP Test - SUCCESS!

Your Gmail SMTP setup for New Steps Project is working perfectly.

Configuration:
- SMTP Server: smtp.gmail.com:587
- From: newstepsfit@gmail.com
- Daily Limit: 500 emails (plenty for your 16-200/day usage)

Next: Deploy to production and test donation confirmations.

New Steps Project - https://newsteps.fit
      `
    };
    
    const info = await transporter.sendMail(testEmail);
    
    console.log('   ✅ Test email sent successfully!');
    console.log('   📧 Message ID:', info.messageId);
    console.log('   📬 Sent to: walterzhang10@gmail.com');
    console.log('   📋 Subject: New Steps Project - Gmail SMTP Test ✅');
    
    console.log('\\n🎉 **GMAIL SMTP SETUP COMPLETE!**');
    console.log('================================================');
    console.log('✅ Connection verified');
    console.log('✅ Test email sent');
    console.log('✅ Ready for production deployment');
    console.log('');
    console.log('📋 **NEXT STEPS:**');
    console.log('1. Check your email (walterzhang10@gmail.com) for the test message');
    console.log('2. Update production environment with Gmail SMTP settings');
    console.log('3. Deploy and test donation confirmation emails');
    console.log('4. Test shoe request confirmation emails');
    
  } catch (error) {
    console.error('\\n❌ **GMAIL SMTP TEST FAILED**');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\\n🔧 **AUTHENTICATION ERROR**');
      console.error('   → Check that 2FA is enabled on newstepsfit@gmail.com');
      console.error('   → Verify app password is correct: hmur irbk apou eftc');
      console.error('   → Try regenerating the app password if needed');
    } else if (error.code === 'ECONNECTION') {
      console.error('\\n🌐 **CONNECTION ERROR**');
      console.error('   → Check internet connection');
      console.error('   → Verify SMTP server: smtp.gmail.com:587');
    }
  }
}

// Run the test
testGmailSMTP().catch(console.error);
