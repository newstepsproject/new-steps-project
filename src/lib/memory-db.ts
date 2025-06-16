import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer | null = null;

/**
 * Start MongoDB Memory Server and return connection URI
 */
export async function startMemoryServer(): Promise<string> {
  if (mongod) {
    console.log('Memory server already running');
    return mongod.getUri();
  }

  try {
    console.log('Starting MongoDB Memory Server...');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log(`MongoDB Memory Server started at: ${uri}`);
    return uri;
  } catch (error) {
    console.error('Failed to start MongoDB Memory Server:', error);
    throw error;
  }
}

/**
 * Stop MongoDB Memory Server
 */
export async function stopMemoryServer(): Promise<void> {
  if (!mongod) {
    console.log('No memory server to stop');
    return;
  }

  try {
    await mongoose.disconnect();
    await mongod.stop();
    mongod = null;
    console.log('MongoDB Memory Server stopped');
  } catch (error) {
    console.error('Failed to stop MongoDB Memory Server:', error);
    throw error;
  }
}

/**
 * Get current MongoDB Memory Server instance
 */
export function getMemoryServer(): MongoMemoryServer | null {
  return mongod;
}

/**
 * Check if MongoDB Memory Server is running
 */
export function isMemoryServerRunning(): boolean {
  return mongod !== null;
}

/**
 * Initialize MongoDB Memory Server if USE_MEMORY_DB is true
 */
export async function initializeMemoryServerIfNeeded(): Promise<void> {
  if (process.env.USE_MEMORY_DB === 'true') {
    try {
      console.log('Initializing MongoDB Memory Server...');
      const uri = await startMemoryServer();
      // Update the MONGODB_URI environment variable
      process.env.MONGODB_URI = uri;
      process.env.TEST_MODE = 'true';
      console.log('MongoDB Memory Server initialized and MONGODB_URI updated to:', uri);
    } catch (error) {
      console.error('Error initializing memory server:', error);
      throw error;
    }
  } else {
    console.log('Skipping MongoDB Memory Server initialization (USE_MEMORY_DB is not true)');
  }
} 