import connectToDatabase from './db';
import mongoose from 'mongoose';

/**
 * Ensures database connection is established and ready
 * @returns The mongoose instance
 * @throws Error if connection fails
 */
export async function ensureDbConnected(): Promise<mongoose.Mongoose> {
  try {
    const db = await connectToDatabase();
    
    // Check connection state
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (db.connection.readyState !== 1) {
      console.log(`Database connection state: ${db.connection.readyState}`);
      
      // If connecting, wait a bit
      if (db.connection.readyState === 2) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check again
        if (db.connection.readyState !== 1) {
          throw new Error(`Database not ready after waiting. State: ${db.connection.readyState}`);
        }
      } else {
        throw new Error(`Database not connected. State: ${db.connection.readyState}`);
      }
    }
    
    // Verify connection with a ping
    try {
      await db.connection.db.admin().ping();
    } catch (pingError) {
      console.error('Database ping failed:', pingError);
      throw new Error('Database connection lost');
    }
    
    return db;
  } catch (error) {
    console.error('Failed to ensure database connection:', error);
    throw error;
  }
}

/**
 * Wraps an API handler with database connection handling
 */
export function withDatabase<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    await ensureDbConnected();
    return handler(...args);
  }) as T;
} 