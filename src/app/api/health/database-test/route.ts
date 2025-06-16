import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import UserModel from '@/models/user';
import { UserRole } from '@/types/user';
import bcrypt from 'bcrypt';

// Get MongoDB URI from environment
const MONGODB_URI = process.env.MONGODB_URI as string;

// Function to test database connection
async function testDatabaseConnection() {
  try {
    // Test direct connection to MongoDB
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
    });
    
    // Get database stats
    const stats = {
      host: mongoose.connection.host,
      name: mongoose.connection.db?.databaseName || 'unknown',
      readyState: mongoose.connection.readyState,
    };
    
    // Check collections
    const collections = mongoose.connection.db ? 
      await mongoose.connection.db.listCollections().toArray() : 
      [];
    
    return {
      success: true,
      message: 'Database connection test completed successfully',
      stats,
      collections: collections.map(c => c.name)
    };
  } catch (error) {
    console.error('Database connection test failed:', error);
    return {
      success: false,
      message: `Database connection test failed: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Function to test user model operations
async function testUserModelOperations() {
  try {
    // Generate test user data with random email to avoid conflicts
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    const testUser = {
      email: testEmail,
      password: hashedPassword,
      name: 'Test User',
      phone: '555-123-4567',
      emailVerified: false,
      role: UserRole.USER,
    };
    
    // Test user creation
    const createdUser = await UserModel.create(testUser);
    
    // Test user retrieval
    const foundUser = await UserModel.findOne({ email: testEmail }).select('+password');
    if (!foundUser) {
      throw new Error('Failed to retrieve created user');
    }
    
    // Test password comparison
    const passwordMatch = await bcrypt.compare(testPassword, foundUser.password || '');
    
    // Clean up - Delete test user
    await UserModel.deleteOne({ email: testEmail });
    
    return {
      success: true,
      message: 'User model operations test completed successfully',
      userId: createdUser._id?.toString() || 'unknown',
      passwordMatch
    };
  } catch (error) {
    console.error('User model operations test failed:', error);
    return {
      success: false,
      message: `User model operations test failed: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error)
    };
  } finally {
    // Clean up - ensure the test user is removed even if test fails
    try {
      await UserModel.deleteOne({ email: `test-${Date.now()}@example.com` });
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

export async function GET() {
  let isConnected = false;
  
  try {
    // First, test the database connection
    const connectionResult = await testDatabaseConnection();
    if (!connectionResult.success) {
      return NextResponse.json(
        { 
          success: false,
          connectionTest: connectionResult,
          message: 'Database tests failed at connection stage'
        }, 
        { status: 500 }
      );
    }
    
    isConnected = true;
    
    // If connection successful, test user model operations
    const userModelResult = await testUserModelOperations();
    
    // Return combined results
    return NextResponse.json({
      success: connectionResult.success && userModelResult.success,
      connectionTest: connectionResult,
      userModelTest: userModelResult,
      message: 'All database tests completed'
    }, { 
      status: (connectionResult.success && userModelResult.success) ? 200 : 500 
    });
  } catch (error) {
    console.error('Database tests failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Database tests failed: ${error instanceof Error ? error.message : String(error)}` 
      }, 
      { status: 500 }
    );
  } finally {
    // Always disconnect to clean up
    if (isConnected) {
      try {
        await mongoose.disconnect();
      } catch (e) {
        console.error('Error disconnecting from database:', e);
      }
    }
  }
} 
