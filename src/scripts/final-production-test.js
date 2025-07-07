#!/usr/bin/env node

/**
 * FINAL PRODUCTION TEST SCRIPT
 * Comprehensive testing before production deployment
 */

const API_BASE = 'http://localhost:3000';

// Test configuration
const testConfig = {
  testEmail: `test-${Date.now()}@example.com`,
  adminEmail: 'admin@newsteps.fit',
  adminPassword: 'Admin123!',
  testPassword: 'TestPassword123'
};

// Test utilities
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.text();
    return {
      status: response.status,
      ok: response.ok,
      data: data ? JSON.parse(data) : null
    };
  } catch (error) {
    return { status: 0, ok: false, error: error.message };
  }
}

async function testEndpoint(name, endpoint, expectedStatus = 200) {
  console.log(`🔍 Testing ${name}...`);
  const result = await makeRequest(endpoint);
  
  if (result.status === expectedStatus) {
    console.log(`✅ ${name}: PASSED (${result.status})`);
    return true;
  } else {
    console.log(`❌ ${name}: FAILED (${result.status}) - ${result.error || 'Unknown error'}`);
    return false;
  }
}

// PHASE 1: Core System Health
async function testSystemHealth() {
  console.log('\n🏥 PHASE 1: SYSTEM HEALTH TESTING');
  const tests = [
    ['Health Check', '/api/health'],
    ['Database Health', '/api/health/database']
  ];
  
  let passed = 0;
  for (const [name, endpoint] of tests) {
    const success = await testEndpoint(name, endpoint);
    if (success) passed++;
  }
  
  console.log(`\n📊 System Health: ${passed}/${tests.length} tests passed`);
  return passed === tests.length;
}

// PHASE 2: Authentication & User Management
async function testAuthentication() {
  console.log('\n🔐 PHASE 2: AUTHENTICATION TESTING');
  
  // Test user registration
  console.log('🔍 Testing user registration...');
  const registerData = {
    firstName: 'Test',
    lastName: 'User',
    email: testConfig.testEmail,
    password: testConfig.testPassword
  };
  
  const registerResult = await makeRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(registerData)
  });
  
  if (registerResult.status === 201) {
    console.log('✅ User Registration: PASSED');
    return true;
  } else {
    console.log(`❌ User Registration: FAILED (${registerResult.status}) - ${registerResult.data?.error || 'Unknown error'}`);
    return false;
  }
}

// PHASE 3: Donation System
async function testDonations() {
  console.log('\n🎁 PHASE 3: DONATION SYSTEM TESTING');
  
  // Test shoe donation
  console.log('🔍 Testing shoe donation...');
  const donationData = {
    firstName: 'Test',
    lastName: 'Donor',
    email: 'testdonor@example.com',
    phone: '1234567890',
    donationDescription: 'Test Nike Soccer Cleats - size 10',
    numberOfShoes: 2,
    isBayArea: false
  };
  
  const donationResult = await makeRequest('/api/donations', {
    method: 'POST',
    body: JSON.stringify(donationData)
  });
  
  if (donationResult.status === 201) {
    console.log('✅ Shoe Donation: PASSED');
    return donationResult.data.donationId;
  } else {
    console.log(`❌ Shoe Donation: FAILED (${donationResult.status}) - ${donationResult.data?.error || 'Unknown error'}`);
    return null;
  }
}

// PHASE 4: Inventory Management
async function testInventory() {
  console.log('\n📦 PHASE 4: INVENTORY TESTING');
  
  // Test shoes API
  console.log('🔍 Testing shoes inventory...');
  const shoesResult = await makeRequest('/api/shoes');
  
  if (shoesResult.status === 200 && shoesResult.data && Array.isArray(shoesResult.data.shoes)) {
    console.log(`✅ Shoes Inventory: PASSED (${shoesResult.data.shoes.length} shoes, ${shoesResult.data.count} total)`);
    return shoesResult.data.shoes;
  } else {
    console.log(`❌ Shoes Inventory: FAILED (${shoesResult.status}) - ${shoesResult.data?.error || 'Unexpected response format'}`);
    return [];
  }
}

// PHASE 5: Request System
async function testRequests() {
  console.log('\n👟 PHASE 5: REQUEST SYSTEM TESTING');
  
  // Test that requests API is protected
  console.log('🔍 Testing request API protection...');
  const requestResult = await makeRequest('/api/requests', {
    method: 'POST',
    body: JSON.stringify({
      items: [{ shoeId: 101, size: '10', gender: 'men' }],
      shippingInfo: { street: '123 Test St', city: 'Test', state: 'CA', zipCode: '12345' }
    })
  });
  
  if (requestResult.status === 401) {
    console.log('✅ Request API Protection: PASSED (401 Unauthorized)');
    return true;
  } else {
    console.log(`❌ Request API Protection: FAILED (${requestResult.status}) - Should be 401`);
    return false;
  }
}

// PHASE 6: Contact System
async function testContact() {
  console.log('\n📞 PHASE 6: CONTACT SYSTEM TESTING');
  
  const contactData = {
    firstName: 'Test',
    lastName: 'Contact',
    email: 'testcontact@example.com',
    subject: 'Test Contact',
    message: 'This is a test contact message'
  };
  
  const contactResult = await makeRequest('/api/contact', {
    method: 'POST',
    body: JSON.stringify(contactData)
  });
  
  if (contactResult.status === 200) {
    console.log('✅ Contact Form: PASSED');
    return true;
  } else {
    console.log(`❌ Contact Form: FAILED (${contactResult.status}) - ${contactResult.data?.error || 'Unknown error'}`);
    return false;
  }
}

// PHASE 7: Money Donation System
async function testMoneyDonations() {
  console.log('\n💰 PHASE 7: MONEY DONATION TESTING');
  
  const moneyDonationData = {
    firstName: 'Test',
    lastName: 'MoneyDonor',
    email: 'testmoney@example.com',
    phone: '1234567890',
    amount: 50,
    donationMethod: 'check'
  };
  
  const moneyResult = await makeRequest('/api/donations/money', {
    method: 'POST',
    body: JSON.stringify(moneyDonationData)
  });
  
  if (moneyResult.status === 201) {
    console.log('✅ Money Donation: PASSED');
    return true;
  } else {
    console.log(`❌ Money Donation: FAILED (${moneyResult.status}) - ${moneyResult.data?.error || 'Unknown error'}`);
    return false;
  }
}

// PHASE 8: Admin System Test
async function testAdminSystem() {
  console.log('\n🔧 PHASE 8: ADMIN SYSTEM TESTING');
  
  // Test admin user creation/existence
  console.log('🔍 Testing admin user creation...');
  const adminResult = await makeRequest('/api/admin/users/ensure-admin', {
    method: 'POST'
  });
  
  if (adminResult.status === 200) {
    console.log('✅ Admin User Creation: PASSED');
    return true;
  } else {
    console.log(`❌ Admin User Creation: FAILED (${adminResult.status}) - ${adminResult.data?.error || 'Unknown error'}`);
    return false;
  }
}

// COMPREHENSIVE TEST EXECUTION
async function runComprehensiveTests() {
  console.log('🚀 STARTING COMPREHENSIVE PRODUCTION TESTING');
  console.log('=' .repeat(70));
  
  const results = {
    systemHealth: await testSystemHealth(),
    authentication: await testAuthentication(),
    donations: await testDonations(),
    inventory: await testInventory(),
    requests: await testRequests(),
    contact: await testContact(),
    moneyDonations: await testMoneyDonations(),
    adminSystem: await testAdminSystem()
  };
  
  console.log('\n' + '=' .repeat(70));
  console.log('📊 FINAL TEST RESULTS:');
  console.log('=' .repeat(70));
  
  let totalPassed = 0;
  const totalTests = Object.keys(results).length;
  
  for (const [testName, passed] of Object.entries(results)) {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${testName.toUpperCase().padEnd(20)}: ${status}`);
    if (passed) totalPassed++;
  }
  
  console.log('=' .repeat(70));
  console.log(`OVERALL RESULT: ${totalPassed}/${totalTests} test suites passed`);
  console.log(`SUCCESS RATE: ${Math.round((totalPassed / totalTests) * 100)}%`);
  
  if (totalPassed === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED - READY FOR PRODUCTION! 🎉');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED - REQUIRES ATTENTION BEFORE PRODUCTION');
  }
  
  return totalPassed === totalTests;
}

// Execute if run directly
if (require.main === module) {
  runComprehensiveTests().catch(console.error);
}

module.exports = { runComprehensiveTests }; 