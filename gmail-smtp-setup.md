# 📧 Gmail SMTP Quick Setup Guide

## **Step 1: Enable Gmail App Passwords**

1. **Go to Google Account Settings**: https://myaccount.google.com/
2. **Security** → **2-Step Verification** (enable if not already)
3. **App passwords** → **Generate app password**
4. **Select app**: Mail
5. **Select device**: Other (custom name) → "New Steps Project"
6. **Copy the 16-character password** (save securely)

## **Step 2: Update Environment Variables**

Add these to your production environment:

```bash
# Gmail SMTP Configuration
EMAIL_FROM=your-email@gmail.com
EMAIL_SERVER=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_SECURE=true
```

## **Step 3: Test Email Configuration**

```javascript
// Test script: test-gmail-smtp.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'test@example.com',
      subject: 'New Steps Project - Email Test',
      text: 'Email system is working!'
    });
    console.log('✅ Email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Email failed:', error);
  }
}

testEmail();
```

## **Step 4: Deploy and Test**

1. **Update production environment** with Gmail SMTP settings
2. **Restart application** to load new config
3. **Test donation confirmation** email
4. **Verify emails are being delivered**

## **Limitations**
- 500 emails/day limit
- Gmail branding in headers
- Not ideal for high volume
- Temporary solution only

## **Next Steps**
- Use Gmail SMTP for immediate functionality
- Set up SendGrid for professional solution
- Continue AWS SES appeal process


