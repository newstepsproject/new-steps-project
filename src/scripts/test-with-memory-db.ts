// Test script using MongoDB memory server
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';
import UserModel from '../models/user';
import { UserRole } from '../types/user';

let mongod: MongoMemoryServer | null = null;

/**
 * Start MongoDB Memory Server and connect to it
 */
async function startDatabase(): Promise<string> {
  try {
    console.log('Starting MongoDB Memory Server...');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    console.log(`Connecting to MongoDB Memory Server at ${uri}`);
    await mongoose.connect(uri);
    
    console.log('Connected to MongoDB Memory Server');
    
    // Set environment variable so other parts of the app can use it
    process.env.MONGODB_URI = uri;
    process.env.TEST_MODE = 'true';
    
    return uri;
  } catch (error) {
    console.error('Failed to start MongoDB Memory Server:', error);
    throw error;
  }
}

/**
 * Stop MongoDB Memory Server
 */
async function stopDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    
    if (mongod) {
      await mongod.stop();
      mongod = null;
      console.log('MongoDB Memory Server stopped');
    }
  } catch (error) {
    console.error('Failed to stop MongoDB Memory Server:', error);
  }
}

/**
 * Seeds the database with initial data
 */
async function seedDatabase() {
  try {
    // Create admin user
    const adminUser = new UserModel({
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '1234567890',
      password: '$2b$10$z7l/gKSh8Sx9qGHQ4FXqSO1yiYt3AO9TCsfCkJ7I8HN/6AwJWZzTO', // 'admin123'
      role: UserRole.ADMIN,
      emailVerified: true
    });
    
    await adminUser.save();
    console.log('Database seeded with admin user');
    
    return { adminUser };
  } catch (error) {
    console.error('Failed to seed database:', error);
    throw error;
  }
}

/**
 * Create a test email account and update environment variables
 */
async function setupTestEmail() {
  try {
    console.log('Creating test email account...');
    const testAccount = await nodemailer.createTestAccount();
    
    // Set environment variables
    process.env.EMAIL_SERVER = testAccount.smtp.host;
    process.env.EMAIL_PORT = testAccount.smtp.port.toString();
    process.env.EMAIL_USERNAME = testAccount.user;
    process.env.EMAIL_PASSWORD = testAccount.pass;
    process.env.EMAIL_FROM = 'noreply@test.com';
    
    console.log('Test email account created:');
    console.log('- Username:', testAccount.user);
    console.log('- Password:', testAccount.pass);
    console.log('- SMTP Host:', testAccount.smtp.host);
    console.log('- SMTP Port:', testAccount.smtp.port);
    console.log('- View emails at: https://ethereal.email/login');
    
    return testAccount;
  } catch (error) {
    console.error('Failed to create test email account:', error);
    throw error;
  }
}

/**
 * Test the email verification flow
 */
async function testEmailVerification() {
  try {
    // Random email to avoid conflicts
    const randomSuffix = Math.floor(Math.random() * 10000);
    const testEmail = `test-user-${randomSuffix}@example.com`;
    
    // Create test user data
    const userData = {
      name: 'Test User',
      email: testEmail,
      phone: '1234567890',
      password: 'password123'
    };
    
    console.log(`\nRegistering user with email: ${testEmail}`);
    
    // Send registration request
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    console.log(`Registration status: ${response.status} ${response.statusText}`);
    console.log('Response:', data);
    
    if (response.status === 201) {
      console.log('\nSuccess! User registered successfully.');
      console.log('Check the Ethereal email inbox to see the verification email:');
      console.log('1. Go to https://ethereal.email/login');
      console.log('2. Log in with the credentials from the test email account');
      console.log('3. Check the inbox for the verification email');
      return true;
    } else {
      console.log('\nRegistration failed');
      return false;
    }
  } catch (error) {
    console.error('Error testing email verification:', error);
    return false;
  }
}

/**
 * Main function to run all tests
 */
async function runTests() {
  try {
    // Setup MongoDB memory server
    await startDatabase();
    await seedDatabase();
    
    // Setup test email account
    await setupTestEmail();
    
    // Run tests
    const result = await testEmailVerification();
    
    console.log('\nTest result:', result ? 'PASSED' : 'FAILED');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Cleanup
    await stopDatabase();
  }
}

// Run the tests
runTests(); 