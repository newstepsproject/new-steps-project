#!/usr/bin/env node

/**
 * Gmail SMTP Implementation for New Steps Project
 * Simple, reliable email sending using Gmail's SMTP servers
 */

const nodemailer = require('nodemailer');

// Gmail SMTP Configuration
const gmailConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USERNAME, // your-gmail@gmail.com
    pass: process.env.EMAIL_PASSWORD  // 16-character app password
  },
  tls: {
    rejectUnauthorized: false
  }
};

// Create transporter
const transporter = nodemailer.createTransporter(gmailConfig);

/**
 * Send email using Gmail SMTP
 */
async function sendEmail(to, subject, html, text = '') {
  try {
    const mailOptions = {
      from: {
        name: 'New Steps Project',
        address: process.env.EMAIL_FROM || process.env.EMAIL_USERNAME
      },
      to: to,
      subject: subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      html: html
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email sent successfully');
    console.log('   To:', to);
    console.log('   Subject:', subject);
    console.log('   Message ID:', info.messageId);
    
    return { 
      success: true, 
      messageId: info.messageId,
      response: info.response 
    };
    
  } catch (error) {
    console.error('❌ Gmail SMTP Error:', error.message);
    
    // Handle common errors
    if (error.code === 'EAUTH') {
      console.error('   → Check your Gmail app password');
    } else if (error.code === 'ECONNECTION') {
      console.error('   → Check internet connection');
    } else if (error.responseCode === 550) {
      console.error('   → Recipient email may be invalid');
    }
    
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
}

/**
 * Test Gmail SMTP connection
 */
async function testConnection() {
  try {
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified');
    return true;
  } catch (error) {
    console.error('❌ Gmail SMTP connection failed:', error.message);
    return false;
  }
}

/**
 * Send donation confirmation email
 */
async function sendDonationConfirmation(donorEmail, donorName, referenceId) {
  const subject = `Thank you for your shoe donation - ${referenceId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Thank You for Your Donation!</h2>
      
      <p>Dear ${donorName},</p>
      
      <p>Thank you for donating shoes to New Steps Project! Your generosity helps young athletes get the equipment they need to pursue their dreams.</p>
      
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong>Donation Reference:</strong> ${referenceId}<br>
        <strong>Status:</strong> Received - We'll contact you about pickup/shipping
      </div>
      
      <p>We'll be in touch soon with next steps for getting your donated shoes to athletes in need.</p>
      
      <p>With gratitude,<br>
      The New Steps Project Team</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #6b7280;">
        New Steps Project - Giving new life to old kicks<br>
        Visit us: <a href="https://newsteps.fit">newsteps.fit</a>
      </p>
    </div>
  `;
  
  return await sendEmail(donorEmail, subject, html);
}

/**
 * Send shoe request confirmation email
 */
async function sendRequestConfirmation(userEmail, userName, requestId, shoes) {
  const subject = `Shoe Request Confirmation - ${requestId}`;
  const shoesList = shoes.map(shoe => `• ${shoe.brand} ${shoe.model} (Size ${shoe.size})`).join('\n');
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Request Received!</h2>
      
      <p>Hi ${userName},</p>
      
      <p>We've received your shoe request and will process it soon!</p>
      
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong>Request ID:</strong> ${requestId}<br>
        <strong>Requested Shoes:</strong><br>
        ${shoesList.replace(/\n/g, '<br>')}
      </div>
      
      <p>We'll review your request and notify you when your shoes are ready to ship.</p>
      
      <p>Best regards,<br>
      The New Steps Project Team</p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 12px; color: #6b7280;">
        New Steps Project - Giving new life to old kicks<br>
        Visit us: <a href="https://newsteps.fit">newsteps.fit</a>
      </p>
    </div>
  `;
  
  return await sendEmail(userEmail, subject, html);
}

// Export functions for use in your app
module.exports = {
  sendEmail,
  testConnection,
  sendDonationConfirmation,
  sendRequestConfirmation
};

// Test script if run directly
if (require.main === module) {
  async function runTest() {
    console.log('🧪 Testing Gmail SMTP for New Steps Project...\n');
    
    // Test connection
    const connectionOk = await testConnection();
    if (!connectionOk) {
      console.log('\n❌ Connection test failed. Check your credentials.');
      return;
    }
    
    // Test email (replace with your email)
    const testEmail = process.env.TEST_EMAIL || 'your-email@example.com';
    
    console.log('\n📧 Sending test email...');
    const result = await sendEmail(
      testEmail,
      'New Steps Project - Gmail SMTP Test',
      '<h1>Success!</h1><p>Gmail SMTP is working for New Steps Project.</p>'
    );
    
    if (result.success) {
      console.log('\n🎉 Gmail SMTP setup complete and working!');
      console.log('   Check your email for the test message.');
    } else {
      console.log('\n❌ Test email failed:', result.error);
    }
  }
  
  runTest().catch(console.error);
}


