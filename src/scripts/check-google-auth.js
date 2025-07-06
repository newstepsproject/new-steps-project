const { spawn } = require('child_process');

// Simple test to check Google OAuth configuration
async function checkGoogleAuth() {
  console.log('🔍 Google OAuth Configuration Check');
  console.log('=====================================\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  const googleClientId = process.env.GOOGLE_CLIENT_ID || 'Not set';
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || 'Not set';
  const nextAuthSecret = process.env.NEXTAUTH_SECRET || 'Not set';
  
  console.log(`GOOGLE_CLIENT_ID: ${googleClientId}`);
  console.log(`GOOGLE_CLIENT_SECRET: ${googleClientSecret.replace(/./g, '*')}`);
  console.log(`NEXTAUTH_SECRET: ${nextAuthSecret ? 'Set' : 'Not set'}`);
  
  // Check if using placeholders
  const isPlaceholderClientId = googleClientId.includes('placeholder') || googleClientId.includes('test_');
  const isPlaceholderSecret = googleClientSecret.includes('placeholder') || googleClientSecret.includes('test_');
  
  console.log('\n🔧 Configuration Status:');
  if (isPlaceholderClientId || isPlaceholderSecret) {
    console.log('❌ Using placeholder Google OAuth credentials');
    console.log('   Google sign-in will NOT work with placeholder credentials');
    console.log('   You need real Google OAuth credentials from Google Cloud Console');
  } else {
    console.log('✅ Using real Google OAuth credentials');
  }
  
  console.log('\n📱 NextAuth Provider Status:');
  try {
    const response = await fetch('http://localhost:3000/api/auth/providers');
    const providers = await response.json();
    
    if (providers.google) {
      console.log('✅ Google provider is configured');
      console.log(`   Sign-in URL: ${providers.google.signinUrl}`);
      console.log(`   Callback URL: ${providers.google.callbackUrl}`);
    } else {
      console.log('❌ Google provider not found');
    }
  } catch (error) {
    console.log('❌ Could not check providers endpoint:', error.message);
  }
  
  console.log('\n🎯 Issues Found:');
  const issues = [];
  
  if (isPlaceholderClientId) {
    issues.push('Placeholder Google Client ID - needs real credentials');
  }
  if (isPlaceholderSecret) {
    issues.push('Placeholder Google Client Secret - needs real credentials');
  }
  if (!nextAuthSecret || nextAuthSecret === 'Not set') {
    issues.push('Missing NEXTAUTH_SECRET - required for JWT signing');
  }
  
  if (issues.length === 0) {
    console.log('✅ No configuration issues found');
  } else {
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
  
  console.log('\n🔧 How to Fix Google OAuth:');
  console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
  console.log('2. Create a new project or select existing one');
  console.log('3. Enable Google+ API');
  console.log('4. Create OAuth 2.0 credentials');
  console.log('5. Add authorized redirect URI: http://localhost:3000/api/auth/callback/google');
  console.log('6. Update .env.local with real credentials:');
  console.log('   GOOGLE_CLIENT_ID=your_real_client_id_from_google');
  console.log('   GOOGLE_CLIENT_SECRET=your_real_client_secret_from_google');
  console.log('7. Restart development server');
  
  console.log('\n✅ Code Changes Already Made:');
  console.log('- Added signIn callback to handle Google OAuth users');
  console.log('- Updated JWT callback to handle Google OAuth tokens');
  console.log('- Added automatic user creation for new Google sign-ins');
  console.log('- Users signing in with Google will be automatically created in database');
  console.log('- Google users will have emailVerified: true and no password');
  
  console.log('\n🧪 Testing Google OAuth:');
  console.log('After setting up real credentials, test by:');
  console.log('1. Go to http://localhost:3000/login');
  console.log('2. Click "Sign in with Google"');
  console.log('3. Complete Google OAuth flow');
  console.log('4. Check if user is created in database');
  console.log('5. Verify user can access protected pages');
  
  return {
    hasRealCredentials: !isPlaceholderClientId && !isPlaceholderSecret,
    hasNextAuthSecret: !!nextAuthSecret && nextAuthSecret !== 'Not set',
    issuesCount: issues.length
  };
}

// Run the check
checkGoogleAuth().then((result) => {
  console.log(`\n📊 Summary: ${result.issuesCount === 0 ? 'Ready for Google OAuth' : `${result.issuesCount} issues need fixing`}`);
  
  if (result.issuesCount === 0) {
    console.log('🎉 Google OAuth is properly configured!');
  } else {
    console.log('⚠️  Google OAuth needs real credentials to work');
  }
}).catch((error) => {
  console.error('❌ Configuration check failed:', error);
}); 