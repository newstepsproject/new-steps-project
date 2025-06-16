import mongoose from 'mongoose';
// import { initializeMemoryServerIfNeeded, startMemoryServer } from './memory-db';

// Define the global mongoose cache type
interface MongooseCache {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
  isConnected: boolean;
}

// Declare the global variable for mongoose cache
declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: mongoose.Mongoose | null;
    promise: Promise<mongoose.Mongoose> | null;
    isConnected: boolean;
  };
}

// Cache the connection
let cached: MongooseCache = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, isConnected: false };
}

/**
 * Connect to MongoDB database
 * @returns Mongoose instance
 */
async function connectToDatabase(): Promise<mongoose.Mongoose> {
  // Check if we have a connection and if it's still active
  if (cached.conn && cached.isConnected) {
    try {
      // Verify the connection is still alive
      await cached.conn.connection.db.admin().ping();
      console.log('Using existing database connection');
      return cached.conn;
    } catch (error) {
      console.log('Existing connection is stale, reconnecting...');
      cached.conn = null;
      cached.promise = null;
      cached.isConnected = false;
    }
  }

  if (!cached.promise) {
    // MongoDB connection URI from environment variables - this may be updated by the memory server
    let MONGODB_URI = process.env.MONGODB_URI as string;
    
    if (!MONGODB_URI) {
      throw new Error('Please define the MONGODB_URI environment variable');
    }

    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    // If TEST_MODE is set, we'll use the MongoDB memory server URI that was set by the test script
    const isTestMode = process.env.TEST_MODE === 'true';
    const isMemoryDb = process.env.USE_MEMORY_DB === 'true';
    
    console.log(`Connecting to MongoDB: ${isTestMode ? 'TEST MODE' : 'PRODUCTION MODE'} ${isMemoryDb ? '(In-Memory)' : ''}`);
    console.log(`MongoDB URI: ${MONGODB_URI.split('@').length > 1 ? MONGODB_URI.split('@')[0].substring(0, 15) + '...' : MONGODB_URI}`);
    
    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('Connected to MongoDB successfully');
        cached.isConnected = true;
        
        // Set up connection event handlers
        mongoose.connection.on('disconnected', () => {
          console.log('MongoDB disconnected');
          cached.isConnected = false;
        });
        
        mongoose.connection.on('connected', () => {
          console.log('MongoDB reconnected');
          cached.isConnected = true;
        });
        
        mongoose.connection.on('error', (err) => {
          console.error('MongoDB connection error:', err);
          cached.isConnected = false;
        });
        
        return mongoose;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        cached.isConnected = false;
        cached.promise = null;
        throw error;
      });
  }

  try {
    const mongoose = await cached.promise;
    cached.conn = mongoose;
    return mongoose;
  } catch (e) {
    cached.promise = null;
    cached.isConnected = false;
    console.error('Failed to connect to MongoDB:', e);
    throw new Error(`MongoDB connection error: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * Test the database connection
 * @returns Connection status object
 */
export async function testDatabaseConnection() {
  try {
    const start = Date.now();
    const conn = await connectToDatabase();
    const connectionTime = Date.now() - start;
    
    return {
      success: true,
      connectionTime,
      message: 'Connected to MongoDB successfully',
      version: conn.version,
      host: conn.connection.host,
      name: conn.connection.name,
      isInMemory: process.env.USE_MEMORY_DB === 'true',
      isTestMode: process.env.TEST_MODE === 'true',
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}`,
      error: error,
      isInMemory: process.env.USE_MEMORY_DB === 'true',
      isTestMode: process.env.TEST_MODE === 'true',
    };
  }
}

/**
 * Disconnect from the database (useful for tests)
 */
export async function disconnectFromDatabase() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    cached.isConnected = false;
    console.log('Disconnected from MongoDB');
  }
}

export default connectToDatabase; 
