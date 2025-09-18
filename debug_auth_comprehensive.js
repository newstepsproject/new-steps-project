const fetch = require('node-fetch');

async function testCompleteLoginFlow() {
    const baseUrl = 'http://localhost:3000';
    
    try {
        console.log('🔐 COMPREHENSIVE LOGIN FLOW TEST');
        console.log('================================');
        
        // Step 1: Get CSRF token
        console.log('\n1. Getting CSRF token...');
        const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
        const { csrfToken } = await csrfResponse.json();
        console.log('✅ CSRF Token:', csrfToken.substring(0, 20) + '...');
        
        // Step 2: Test credentials provider directly
        console.log('\n2. Testing credentials authorization...');
        const testResponse = await fetch(`${baseUrl}/api/auth/test-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'walterzhang10@gmail.com',
                password: 'TestPass123!'
            })
        });
        const testResult = await testResponse.json();
        console.log('✅ Direct auth test:', testResult.success ? 'SUCCESS' : 'FAILED');
        
        // Step 3: Try NextAuth signin with proper headers
        console.log('\n3. Testing NextAuth signin...');
        const signinResponse = await fetch(`${baseUrl}/api/auth/signin/credentials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': `next-auth.csrf-token=${csrfToken}`
            },
            body: new URLSearchParams({
                email: 'walterzhang10@gmail.com',
                password: 'TestPass123!',
                csrfToken: csrfToken,
                redirect: 'false',
                json: 'true'
            }),
            redirect: 'manual'
        });
        
        console.log('Response status:', signinResponse.status);
        console.log('Response headers:', Object.fromEntries(signinResponse.headers.entries()));
        
        if (signinResponse.status === 200) {
            const result = await signinResponse.json();
            console.log('✅ Login result:', result);
        } else {
            console.log('⚠️ Redirect or error response');
        }
        
        // Step 4: Check what's in the session
        console.log('\n4. Checking session...');
        const sessionResponse = await fetch(`${baseUrl}/api/auth/session`);
        const session = await sessionResponse.json();
        console.log('Session:', session);
        
    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testCompleteLoginFlow();
