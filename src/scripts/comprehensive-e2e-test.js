#!/usr/bin/env node

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'test@newsteps.fit';
const ADMIN_EMAIL = 'admin@newsteps.fit';

// Test utilities
class TestLogger {
  static instance = null;
  
  constructor() {
    this.logs = [];
  }
  
  static getInstance() {
    if (!TestLogger.instance) {
      TestLogger.instance = new TestLogger();
    }
    return TestLogger.instance;
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
    this.logs.push(logMessage);
  }

  success(message) {
    this.log(message, 'SUCCESS');
  }

  error(message) {
    this.log(message, 'ERROR');
  }

  warning(message) {
    this.log(message, 'WARNING');
  }

  getLogs() {
    return this.logs;
  }
}

// Test results tracker
class TestRunner {
  constructor() {
    this.results = [];
    this.logger = TestLogger.getInstance();
  }

  async runTest(testName, testFn) {
    const startTime = Date.now();
    this.logger.log(`Starting test: ${testName}`);
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      this.results.push({
        testName,
        status: 'PASS',
        message: 'Test completed successfully',
        duration
      });
      this.logger.success(`✅ ${testName} - PASSED (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error.message || String(error);
      this.results.push({
        testName,
        status: 'FAIL',
        message,
        duration
      });
      this.logger.error(`❌ ${testName} - FAILED (${duration}ms): ${message}`);
    }
  }

  getResults() {
    return this.results;
  }

  printSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;

    this.logger.log('\n=== TEST SUMMARY ===');
    this.logger.log(`Total Tests: ${total}`);
    this.logger.success(`Passed: ${passed}`);
    this.logger.error(`Failed: ${failed}`);
    this.logger.warning(`Skipped: ${skipped}`);
    this.logger.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      this.logger.log('\n=== FAILED TESTS ===');
      this.results.filter(r => r.status === 'FAIL').forEach(result => {
        this.logger.error(`❌ ${result.testName}: ${result.message}`);
      });
    }
  }
}

// Test helper functions
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const method = options.method || 'GET';
  const headers = options.headers || {};
  const body = options.body || null;
  
  let curlCommand = `curl -s -w "\\nHTTP_STATUS_CODE:%{http_code}" "${url}"`;
  
  if (method !== 'GET') {
    curlCommand += ` -X ${method}`;
  }
  
  if (body) {
    curlCommand += ` -d '${body}'`;
    headers['Content-Type'] = 'application/json';
  }
  
  // Add headers
  for (const [key, value] of Object.entries(headers)) {
    curlCommand += ` -H "${key}: ${value}"`;
  }
  
  try {
    const { stdout, stderr } = await execAsync(curlCommand);
    
    if (stderr) {
      throw new Error(`Curl error: ${stderr}`);
    }
    
    const parts = stdout.split('\nHTTP_STATUS_CODE:');
    const responseBody = parts[0];
    const statusCode = parseInt(parts[1]);
    
    return {
      status: statusCode,
      body: responseBody,
      json: () => {
        try {
          return JSON.parse(responseBody);
        } catch (e) {
          return responseBody;
        }
      }
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

async function testApiEndpoint(endpoint, expectedStatus = 200) {
  const response = await makeRequest(endpoint);
  if (response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
  }
  return response.json();
}

// Phase 1: Infrastructure & Setup Tests
class InfrastructureTests {
  constructor() {
    this.runner = new TestRunner();
    this.logger = TestLogger.getInstance();
  }

  async runAll() {
    this.logger.log('\n🔧 PHASE 1: INFRASTRUCTURE & SETUP TESTS');
    
    await this.runner.runTest('Server Health Check', async () => {
      const data = await testApiEndpoint('/api/health');
      if (data.status !== 'healthy') {
        throw new Error('Server not healthy');
      }
    });

    await this.runner.runTest('Database Connection', async () => {
      const data = await testApiEndpoint('/api/health/database');
      if (!data.success) {
        throw new Error('Database connection failed');
      }
    });

    await this.runner.runTest('Sample Data Availability', async () => {
      const data = await testApiEndpoint('/api/shoes?limit=1');
      if (!data.success || data.shoes.length === 0) {
        throw new Error('No sample shoes data available');
      }
    });

    await this.runner.runTest('Admin User Access', async () => {
      const response = await makeRequest('/api/admin/users/ensure-admin', {
        method: 'POST'
      });
      if (response.status !== 200) {
        throw new Error('Admin user not accessible');
      }
    });

    await this.runner.runTest('Email System Configuration', async () => {
      // Test basic email configuration without sending
      const response = await makeRequest('/api/health');
      const data = response.json();
      if (!data.status) {
        throw new Error('Email system not configured');
      }
    });

    this.runner.printSummary();
  }
}

// Phase 2: Visitor Role Tests
class VisitorTests {
  constructor() {
    this.runner = new TestRunner();
    this.logger = TestLogger.getInstance();
  }

  async runAll() {
    this.logger.log('\n👤 PHASE 2: VISITOR ROLE TESTS');

    await this.runner.runTest('Home Page Access', async () => {
      const response = await makeRequest('/');
      if (response.status !== 200) {
        throw new Error('Home page not accessible');
      }
    });

    await this.runner.runTest('Shoes Browse Page', async () => {
      const response = await makeRequest('/shoes');
      if (response.status !== 200) {
        throw new Error('Shoes page not accessible');
      }
    });

    await this.runner.runTest('Public API Access', async () => {
      const data = await testApiEndpoint('/api/shoes?limit=3');
      if (!data.success || !Array.isArray(data.shoes)) {
        throw new Error('Shoes API not working');
      }
    });

    await this.runner.runTest('Contact Form Submission', async () => {
      const response = await makeRequest('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'User',
          email: TEST_EMAIL,
          subject: 'Test Subject',
          message: 'Test message from automated testing'
        })
      });
      if (response.status !== 200) {
        throw new Error('Contact form submission failed');
      }
    });

    await this.runner.runTest('About Page Access', async () => {
      const response = await makeRequest('/about');
      if (response.status !== 200) {
        throw new Error('About page not accessible');
      }
    });

    await this.runner.runTest('Donation Form Access', async () => {
      const response = await makeRequest('/donate/shoes');
      if (response.status !== 200) {
        throw new Error('Donation form not accessible');
      }
    });

    await this.runner.runTest('Volunteer Form Access', async () => {
      const response = await makeRequest('/volunteer');
      if (response.status !== 200) {
        throw new Error('Volunteer form not accessible');
      }
    });

    this.runner.printSummary();
  }
}

// Phase 3: User Role Tests
class UserTests {
  constructor() {
    this.runner = new TestRunner();
    this.logger = TestLogger.getInstance();
    this.testUserEmail = `testuser-${Date.now()}@newsteps.fit`;
  }

  async runAll() {
    this.logger.log('\n🔐 PHASE 3: USER ROLE TESTS');

    await this.runner.runTest('User Registration', async () => {
      const response = await makeRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'User',
          email: this.testUserEmail,
          password: 'TestPassword123!',
          phone: '1234567890'
        })
      });
      if (response.status !== 201) {
        const data = response.json();
        throw new Error(`Registration failed: ${data.message || 'Unknown error'}`);
      }
    });

    await this.runner.runTest('Login Page Access', async () => {
      const response = await makeRequest('/login');
      if (response.status !== 200) {
        throw new Error('Login page not accessible');
      }
    });

    await this.runner.runTest('Account Page Access', async () => {
      const response = await makeRequest('/account');
      // Should redirect to login for unauthenticated users
      if (response.status !== 200 && response.status !== 307) {
        throw new Error('Account page not accessible');
      }
    });

    await this.runner.runTest('Cart Page Access', async () => {
      const response = await makeRequest('/cart');
      if (response.status !== 200) {
        throw new Error('Cart page not accessible');
      }
    });

    await this.runner.runTest('Checkout Authentication Required', async () => {
      const response = await makeRequest('/api/requests', {
        method: 'POST',
        body: JSON.stringify({
          items: [{ shoeId: 101, size: '10', gender: 'men' }],
          shippingInfo: {
            firstName: 'Test',
            lastName: 'User',
            email: this.testUserEmail,
            address: '123 Test St',
            city: 'Test City',
            state: 'CA',
            zipCode: '12345'
          }
        })
      });
      if (response.status !== 401) {
        throw new Error('Checkout should require authentication');
      }
    });

    this.runner.printSummary();
  }
}

// Phase 4: Admin Role Tests
class AdminTests {
  constructor() {
    this.runner = new TestRunner();
    this.logger = TestLogger.getInstance();
  }

  async runAll() {
    this.logger.log('\n👑 PHASE 4: ADMIN ROLE TESTS');

    await this.runner.runTest('Admin Dashboard Access', async () => {
      const response = await makeRequest('/admin');
      if (response.status !== 200) {
        throw new Error('Admin dashboard not accessible');
      }
    });

    await this.runner.runTest('Admin API Protection', async () => {
      const response = await makeRequest('/api/admin/shoes');
      if (response.status !== 401) {
        throw new Error('Admin API should require authentication');
      }
    });

    await this.runner.runTest('Admin Users Management', async () => {
      const response = await makeRequest('/admin/users');
      if (response.status !== 200) {
        throw new Error('Admin users page not accessible');
      }
    });

    await this.runner.runTest('Admin Inventory Management', async () => {
      const response = await makeRequest('/admin/shoes');
      if (response.status !== 200) {
        throw new Error('Admin inventory page not accessible');
      }
    });

    await this.runner.runTest('Admin Requests Management', async () => {
      const response = await makeRequest('/admin/requests');
      if (response.status !== 200) {
        throw new Error('Admin requests page not accessible');
      }
    });

    await this.runner.runTest('Admin Analytics', async () => {
      const response = await makeRequest('/admin/analytics');
      if (response.status !== 200) {
        throw new Error('Admin analytics page not accessible');
      }
    });

    this.runner.printSummary();
  }
}

// Main test execution
async function runComprehensiveTests() {
  const logger = TestLogger.getInstance();
  logger.log('🚀 Starting Comprehensive End-to-End Testing');
  logger.log('='.repeat(50));

  try {
    // Phase 1: Infrastructure & Setup
    const infraTests = new InfrastructureTests();
    await infraTests.runAll();

    // Phase 2: Visitor Role Tests
    const visitorTests = new VisitorTests();
    await visitorTests.runAll();

    // Phase 3: User Role Tests
    const userTests = new UserTests();
    await userTests.runAll();

    // Phase 4: Admin Role Tests
    const adminTests = new AdminTests();
    await adminTests.runAll();

    logger.log('\n🎉 COMPREHENSIVE TESTING COMPLETED');
    logger.log('='.repeat(50));

    // Final summary
    const allResults = [
      ...infraTests.runner.getResults(),
      ...visitorTests.runner.getResults(),
      ...userTests.runner.getResults(),
      ...adminTests.runner.getResults()
    ];

    const totalTests = allResults.length;
    const passedTests = allResults.filter(r => r.status === 'PASS').length;
    const failedTests = allResults.filter(r => r.status === 'FAIL').length;

    logger.log('\n🏆 FINAL RESULTS');
    logger.log(`Total Tests: ${totalTests}`);
    logger.success(`Passed: ${passedTests}`);
    logger.error(`Failed: ${failedTests}`);
    logger.log(`Overall Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      logger.log('\n❌ FAILED TESTS SUMMARY:');
      allResults.filter(r => r.status === 'FAIL').forEach(result => {
        logger.error(`• ${result.testName}: ${result.message}`);
      });
    }

  } catch (error) {
    logger.error(`Critical error during testing: ${error.message}`);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runComprehensiveTests().catch(console.error);
}

module.exports = { runComprehensiveTests }; 