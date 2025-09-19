const { signIn, getSession } = require('next-auth/react');

// Test NextAuth configuration
console.log('NextAuth Environment Check:');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('NEXTAUTH_SECRET length:', process.env.NEXTAUTH_SECRET?.length || 0);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Test direct credential login
async function testDirectLogin() {
    try {
        console.log('\n🔐 Testing direct credential login...');
        
        const response = await fetch('http://localhost:3000/api/auth/signin/credentials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                email: 'walterzhang10@gmail.com',
                password: 'TestPass123!',
                redirect: 'false'
            })
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        const text = await response.text();
        console.log('Response body:', text);
        
    } catch (error) {
        console.error('Direct login test error:', error);
    }
}

// Test session endpoint
async function testSession() {
    try {
        console.log('\n📊 Testing session endpoint...');
        
        const response = await fetch('http://localhost:3000/api/auth/session');
        console.log('Session status:', response.status);
        
        const session = await response.json();
        console.log('Session data:', session);
        
    } catch (error) {
        console.error('Session test error:', error);
    }
}

// Run tests
testDirectLogin().then(() => testSession());
