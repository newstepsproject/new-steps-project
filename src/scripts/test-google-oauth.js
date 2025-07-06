const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

function testGoogleOAuthConfig() {
  console.log('🔍 Testing Google OAuth Configuration');
  console.log('====================================\n');
  
  // Check environment variables
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  
  console.log('📋 Environment Variables:');
  console.log(`GOOGLE_CLIENT_ID: ${googleClientId}`);
  console.log(`GOOGLE_CLIENT_SECRET: ${googleClientSecret ? '***SET***' : 'NOT SET'}`);
  console.log(`NEXTAUTH_SECRET: ${nextAuthSecret ? '***SET***' : 'NOT SET'}`);
  console.log(`NEXTAUTH_URL: ${nextAuthUrl}\n`);
  
  // Validate credentials format
  const isValidClientId = googleClientId && googleClientId.includes('.apps.googleusercontent.com');
  const isValidClientSecret = googleClientSecret && googleClientSecret.startsWith('GOCSPX-');
  
  console.log('🔍 Credential Validation:');
  console.log(`✅ Client ID format: ${isValidClientId ? 'Valid' : 'Invalid'}`);
  console.log(`✅ Client Secret format: ${isValidClientSecret ? 'Valid' : 'Invalid'}`);
  console.log(`✅ NextAuth Secret: ${nextAuthSecret ? 'Set' : 'Missing'}`);
  console.log(`✅ NextAuth URL: ${nextAuthUrl ? 'Set' : 'Missing'}\n`);
  
  // Check for placeholder values
  const hasPlaceholders = googleClientId === 'placeholder_google_client_id' || 
                         googleClientSecret === 'placeholder_google_client_secret';
  
  if (hasPlaceholders) {
    console.log('❌ Still using placeholder credentials!');
    console.log('   Please update with real Google OAuth credentials.\n');
  } else {
    console.log('✅ Real Google OAuth credentials detected!\n');
  }
  
  // Configuration summary
  console.log('🎯 Configuration Summary:');
  if (isValidClientId && isValidClientSecret && nextAuthSecret && !hasPlaceholders) {
    console.log('✅ Google OAuth is properly configured!');
    console.log('✅ Ready for testing in browser');
    console.log('\n📱 Next Steps:');
    console.log('1. Go to http://localhost:3000/login');
    console.log('2. Click "Sign in with Google"');
    console.log('3. Complete OAuth flow');
    console.log('4. Check if user is created in database');
  } else {
    console.log('❌ Google OAuth configuration incomplete');
    console.log('   Please check the issues above');
  }
  
  console.log('\n🔗 Test URLs:');
  console.log(`Login Page: http://localhost:3000/login`);
  console.log(`OAuth Providers: http://localhost:3000/api/auth/providers`);
  console.log(`Google Sign-in: http://localhost:3000/api/auth/signin/google`);
}

testGoogleOAuthConfig(); 