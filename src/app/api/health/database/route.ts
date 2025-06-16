import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Get MongoDB URI from environment
const MONGODB_URI = process.env.MONGODB_URI as string;

export async function GET() {
  let isConnected = false;

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
    });
    isConnected = true;
    
    // Get basic connection info
    const connectionInfo = {
      host: mongoose.connection.host,
      name: mongoose.connection.db?.databaseName || 'unknown',
      readyState: mongoose.connection.readyState,
      ping: await mongoose.connection.db?.command({ ping: 1 })
    };
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      connection: connectionInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Database connection failed: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
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
