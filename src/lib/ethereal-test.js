// A utility script to create a test account on Ethereal for email testing
const nodemailer = require('nodemailer');

async function createTestAccount() {
  try {
    // Create a test account on Ethereal
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('Test account created:');
    console.log('Email:', testAccount.user);
    console.log('Password:', testAccount.pass);
    console.log('SMTP Host:', testAccount.smtp.host);
    console.log('SMTP Port:', testAccount.smtp.port);
    
    console.log('\nAdd these to your .env.local file:');
    console.log(`EMAIL_SERVER=${testAccount.smtp.host}`);
    console.log(`EMAIL_PORT=${testAccount.smtp.port}`);
    console.log(`EMAIL_USERNAME=${testAccount.user}`);
    console.log(`EMAIL_PASSWORD=${testAccount.pass}`);
    console.log(`EMAIL_FROM=noreply@newsteps.fit`);
    
    console.log('\nTo view sent emails, go to:');
    console.log('https://ethereal.email/login');
    console.log('And log in with the credentials above.');
  } catch (error) {
    console.error('Error creating test account:', error);
  }
}

createTestAccount(); 