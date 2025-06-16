// Generate new Ethereal Email credentials
const nodemailer = require('nodemailer');

async function generateEtherealAccount() {
  console.log('Creating a new Ethereal Email account...');
  
  try {
    // Create a test account at Ethereal
    const testAccount = await nodemailer.createTestAccount();
    
    console.log('Ethereal Email account created successfully!');
    console.log('-------------------------------------------');
    console.log('USERNAME:', testAccount.user);
    console.log('PASSWORD:', testAccount.pass);
    console.log('SERVER: smtp.ethereal.email');
    console.log('PORT: 587');
    console.log('-------------------------------------------');
    console.log('Update your .env.local file with these credentials');
    console.log(`EMAIL_USERNAME=${testAccount.user}`);
    console.log(`EMAIL_PASSWORD=${testAccount.pass}`);
    
    // Create a transporter and test it
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    // Test the connection
    console.log('\nTesting connection to Ethereal Email...');
    
    try {
      const result = await transporter.verify();
      console.log('Connection successful:', result);
      
      // Send a test email
      console.log('\nSending a test email...');
      const info = await transporter.sendMail({
        from: '"Test Sender" <test@example.com>',
        to: testAccount.user,
        subject: 'Test Email',
        text: 'This is a test email to verify the account is working.',
        html: '<p>This is a test email to verify the account is working.</p>',
      });
      
      console.log('Test email sent:', info.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    } catch (error) {
      console.error('Connection failed:', error);
    }
  } catch (error) {
    console.error('Failed to create Ethereal account:', error);
  }
}

// Run the function
generateEtherealAccount()
  .catch(console.error); 