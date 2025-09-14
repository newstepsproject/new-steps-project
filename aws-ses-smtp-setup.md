# 📧 AWS SES SMTP Setup (Using Existing Credentials)

## **Good News!** 
You already have AWS SES SMTP credentials that can send emails immediately!

## **Environment Configuration**

Update your production environment with these existing credentials:

```bash
# AWS SES SMTP Configuration (from your credentials file)
EMAIL_FROM=newstepsfit@gmail.com
EMAIL_SERVER=email-smtp.us-west-2.amazonaws.com
EMAIL_PORT=587
EMAIL_USERNAME=AKIAVGC5FGUXXR25IM73
EMAIL_PASSWORD=BC6CJveZEhsn1g7sZma0ybKiW5/WgwJdEf8mVfpqaw5E
EMAIL_SECURE=false
EMAIL_TLS=true
```

## **How This Works**

AWS SES SMTP credentials work differently than production access:
- ✅ **SMTP credentials** = Can send emails through SMTP
- ❌ **Production access** = Can send to any email address
- ⚠️ **Sandbox mode** = Can only send to verified email addresses

## **Verification Strategy**

Since you're in sandbox mode, you need to verify recipient emails:

### **Step 1: Verify Key Email Addresses**

Go to AWS SES Console and verify these emails:
```bash
# Verify these in AWS SES:
1. newstepsfit@gmail.com (your admin email)
2. walterzhang10@gmail.com (your personal email)  
3. Any other emails you want to test with
```

### **Step 2: Test Email Sending**

```javascript
// test-aws-ses-smtp.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: 'email-smtp.us-west-2.amazonaws.com',
  port: 587,
  secure: false,
  auth: {
    user: 'AKIAVGC5FGUXXR25IM73',
    pass: 'BC6CJveZEhsn1g7sZma0ybKiW5/WgwJdEf8mVfpqaw5E'
  }
});

async function testSES() {
  try {
    const info = await transporter.sendMail({
      from: 'newstepsfit@gmail.com',
      to: 'walterzhang10@gmail.com', // Must be verified in SES
      subject: 'New Steps - AWS SES SMTP Test',
      html: '<h1>Success!</h1><p>AWS SES SMTP is working!</p>'
    });
    
    console.log('✅ Email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSES();
```

### **Step 3: Verify More Emails as Needed**

For testing and admin purposes, verify additional emails:
```bash
# In AWS SES Console → Verified identities:
- Add your personal email
- Add team member emails  
- Add test email addresses
```

## **Limitations in Sandbox Mode**

```bash
❌ Cannot send to unverified emails (user donations won't get confirmations)
✅ Can send to verified emails (admin notifications work)
✅ Perfect for testing and development
✅ Admin operations work fine
```

## **Production Strategy**

```bash
Phase 1 (Immediate): Use AWS SES SMTP for admin/testing
Phase 2 (Long-term): Set up SendGrid for user emails
Phase 3 (Optional): Continue AWS SES appeal process
```


