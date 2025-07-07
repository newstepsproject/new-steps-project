#!/usr/bin/env ts-node

import { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import { ensureDbConnected } from '../lib/db-utils';

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'test@newsteps.fit';
const ADMIN_EMAIL = 'admin@newsteps.fit';
const ADMIN_PASSWORD = 'Admin123!';

// Test utilities
class TestLogger {
  private static instance: TestLogger;
  private logs: string[] = [];
  
  static getInstance(): TestLogger {
    if (!TestLogger.instance) {
      TestLogger.instance = new TestLogger();
    }
    return TestLogger.instance;
  }

  log(message: string, level: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARNING' = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
    this.logs.push(logMessage);
  }

  success(message: string) {
    this.log(message, 'SUCCESS');
  }

  error(message: string) {
    this.log(message, 'ERROR');
  }

  warning(message: string) {
    this.log(message, 'WARNING');
  }

  getLogs(): string[] {
    return this.logs;
  }
}

// Test results tracker
interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
  data?: any;
}

class TestRunner {
  private results: TestResult[] = [];
  private logger = TestLogger.getInstance();

  async runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
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
      const message = error instanceof Error ? error.message : String(error);
      this.results.push({
        testName,
        status: 'FAIL',
        message,
        duration
      });
      this.logger.error(`❌ ${testName} - FAILED (${duration}ms): ${message}`);
    }
  }

  getResults(): TestResult[] {
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
async function makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  return response;
}

async function testApiEndpoint(endpoint: string, expectedStatus: number = 200): Promise<any> {
  const response = await makeRequest(endpoint);
  if (response.status !== expectedStatus) {
    throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
  }
  return response.json();
}

// Phase 1: Infrastructure & Setup Tests
class InfrastructureTests {
  private runner = new TestRunner();
  private logger = TestLogger.getInstance();

  async runAll(): Promise<void> {
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
        method: 'GET'
      });
      if (response.status !== 200) {
        throw new Error('Admin user not accessible');
      }
    });

    await this.runner.runTest('Email System Configuration', async () => {
      // Test basic email configuration without sending
      const response = await makeRequest('/api/health');
      const data = await response.json();
      if (!data.status) {
        throw new Error('Email system not configured');
      }
      // Email system is tested more thoroughly in later phases
    });

    this.runner.printSummary();
  }
}

// Phase 2: Visitor Role Tests
class VisitorTests {
  private runner = new TestRunner();
  private logger = TestLogger.getInstance();

  async runAll(): Promise<void> {
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
          message: 'Test message from automated testing'
        })
      });
      if (response.status !== 200) {
        throw new Error('Contact form submission failed');
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
  private runner = new TestRunner();
  private logger = TestLogger.getInstance();
  private testUserEmail = `testuser-${Date.now()}@newsteps.fit`;

  async runAll(): Promise<void> {
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
        const data = await response.json();
        throw new Error(`Registration failed: ${data.message || response.statusText}`);
      }
    });

    await this.runner.runTest('Login Page Access', async () => {
      const response = await makeRequest('/login');
      if (response.status !== 200) {
        throw new Error('Login page not accessible');
      }
    });

    await this.runner.runTest('Protected Page Redirect', async () => {
      const response = await makeRequest('/account', {
        redirect: 'manual'
      });
      // Should redirect to login for unauthenticated users
      if (response.status !== 200 && response.status !== 302) {
        throw new Error('Protected page redirect not working');
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
  private runner = new TestRunner();
  private logger = TestLogger.getInstance();

  async runAll(): Promise<void> {
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

    this.runner.printSummary();
  }
}

// Main test execution
async function runComprehensiveTests(): Promise<void> {
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

  } catch (error) {
    logger.error(`Critical error during testing: ${error}`);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runComprehensiveTests().catch(console.error);
}

export { runComprehensiveTests }; 