# 📧 SendGrid Integration for New Steps Project

## **Environment Configuration**

Update your production environment file with SendGrid settings:

```bash
# Replace AWS SES settings with SendGrid
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your_api_key_here
EMAIL_FROM=noreply@newsteps.fit
EMAIL_FROM_NAME=New Steps Project

# Remove these AWS SES settings:
# EMAIL_SERVER=email-smtp.us-west-2.amazonaws.com
# EMAIL_PORT=587
# EMAIL_USERNAME=your_ses_smtp_username
# EMAIL_PASSWORD=your_ses_smtp_password
```

## **Code Integration**

### **Option 1: Update Existing Email Function**

If you're using nodemailer, update your email configuration:

```javascript
// lib/email.ts - Update your existing email setup
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});

// Your existing sendEmail function should work with minimal changes
```

### **Option 2: Use SendGrid SDK (Recommended)**

```bash
# Install SendGrid SDK
npm install @sendgrid/mail
```

```javascript
// lib/sendgrid-email.ts - New SendGrid implementation
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmail(to: string, subject: string, html: string, text?: string) {
  const msg = {
    to: to,
    from: {
      email: process.env.EMAIL_FROM || 'noreply@newsteps.fit',
      name: 'New Steps Project'
    },
    subject: subject,
    text: text || '',
    html: html,
  };

  try {
    await sgMail.send(msg);
    console.log('✅ Email sent successfully to:', to);
    return { success: true };
  } catch (error) {
    console.error('❌ SendGrid email failed:', error);
    return { success: false, error: error.message };
  }
}
```

## **Domain Authentication (Optional but Recommended)**

### **Step 1: Add DNS Records**

SendGrid will provide these DNS records for newsteps.fit:

```
Type: CNAME
Name: s1._domainkey.newsteps.fit
Value: s1.domainkey.u[XXXXX].wl[XXX].sendgrid.net

Type: CNAME  
Name: s2._domainkey.newsteps.fit
Value: s2.domainkey.u[XXXXX].wl[XXX].sendgrid.net

Type: CNAME
Name: em[XXXX].newsteps.fit
Value: u[XXXXX].wl[XXX].sendgrid.net
```

### **Step 2: Verify Domain**

1. **Go to SendGrid** → **Settings** → **Sender Authentication**
2. **Authenticate Your Domain**
3. **Enter**: newsteps.fit
4. **Add DNS records** provided by SendGrid
5. **Verify** (may take 24-48 hours)

## **Testing SendGrid Integration**

### **Test Script**

```javascript
// test-sendgrid.js
require('dotenv').config();
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'your-email@example.com', // Change to your email
  from: 'noreply@newsteps.fit',
  subject: 'New Steps Project - SendGrid Test',
  text: 'Email system is working with SendGrid!',
  html: '<h1>Email system is working with SendGrid!</h1><p>This is a test email from New Steps Project.</p>',
};

sgMail.send(msg)
  .then(() => {
    console.log('✅ SendGrid test email sent successfully');
  })
  .catch((error) => {
    console.error('❌ SendGrid test failed:', error);
  });
```

### **Run Test**

```bash
# Test SendGrid integration
node test-sendgrid.js
```

## **Deployment Steps**

1. **Update environment variables** on production server
2. **Install SendGrid package** if using SDK approach
3. **Update email functions** to use SendGrid
4. **Restart application** to load new configuration
5. **Test donation confirmation** email
6. **Monitor SendGrid dashboard** for delivery stats

## **SendGrid Dashboard Monitoring**

After setup, monitor:
- **Activity Feed**: See all sent emails
- **Statistics**: Delivery rates, bounces, spam reports
- **Suppressions**: Manage bounced/unsubscribed emails
- **Alerts**: Set up notifications for issues

## **Benefits Over AWS SES**

- ✅ **Immediate approval** (no waiting)
- ✅ **Better non-profit support**
- ✅ **Free tier sufficient** for current needs
- ✅ **Excellent deliverability**
- ✅ **Better dashboard and analytics**
- ✅ **Easier domain authentication**


