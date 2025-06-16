import mongoose from 'mongoose';
import connectToDatabase, { disconnectFromDatabase } from '@/lib/db';
import UserModel from '@/models/user';
import { UserRole } from '@/types/user';
import bcrypt from 'bcrypt';

/**
 * Test database connectivity
 */
export async function testDatabaseConnection() {
  try {
    // Test basic connection
    const conn = await connectToDatabase();
    console.log('Database connection successful');
    
    // Get connection stats
    const stats = {
      host: conn.connection.host,
      name: conn.connection.name,
      port: conn.connection.port,
      readyState: conn.connection.readyState,
    };
    
    console.log('Connection stats:', stats);
    
    // Check collections - added null check for db property
    if (!mongoose.connection.db) {
      console.warn('Database object is not available on connection');
      return {
        success: true,
        message: 'Database connection succeeded but db object is not available',
        stats,
        collectionsCount: 0
      };
    }
    
    const collections = await mongoose.connection.db.collections();
    console.log(`Available collections (${collections.length}):`, 
      collections.map(c => c.collectionName).join(', '));
    
    return {
      success: true,
      message: 'Database connection test completed successfully',
      stats,
      collectionsCount: collections.length
    };
  } catch (error) {
    console.error('Database connection test failed:', error);
    return {
      success: false,
      message: `Database connection test failed: ${error instanceof Error ? error.message : String(error)}`,
      error: error
    };
  }
}

/**
 * Test user model operations
 */
export async function testUserModelOperations() {
  try {
    // Ensure database connection
    await connectToDatabase();
    
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
    console.log('Creating test user...');
    const createdUser = await UserModel.create(testUser);
    console.log('Test user created:', createdUser._id);
    
    // Test user retrieval
    const foundUser = await UserModel.findOne({ email: testEmail });
    if (!foundUser) {
      throw new Error('Failed to retrieve created user');
    }
    console.log('Test user retrieved successfully');
    
    // Test password comparison
    const passwordMatch = await bcrypt.compare(testPassword, foundUser.password || '');
    console.log('Password comparison:', passwordMatch ? 'successful' : 'failed');
    
    // Clean up - Delete test user
    await UserModel.deleteOne({ email: testEmail });
    console.log('Test user deleted');
    
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
      error: error
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

/**
 * Run all database tests
 */
export async function runAllDatabaseTests() {
  try {
    console.log('Starting database tests...');
    
    // Test database connection
    const connectionResult = await testDatabaseConnection();
    if (!connectionResult.success) {
      return {
        success: false,
        connectionTest: connectionResult,
        message: 'Database tests failed at connection stage'
      };
    }
    
    // Test user model operations
    const userModelResult = await testUserModelOperations();
    
    // Clean up connection
    await disconnectFromDatabase();
    
    return {
      success: connectionResult.success && userModelResult.success,
      connectionTest: connectionResult,
      userModelTest: userModelResult,
      message: 'All database tests completed'
    };
  } catch (error) {
    console.error('Database tests failed:', error);
    return {
      success: false,
      message: `Database tests failed: ${error instanceof Error ? error.message : String(error)}`,
      error: error
    };
  } finally {
    // Ensure disconnection in case of errors
    await disconnectFromDatabase();
  }
} 