import { NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/db';

export async function GET() {
  try {
    // Use the shared database connection testing function
    const dbStatus = await testDatabaseConnection();
    
    if (dbStatus.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Database connection successful',
        connection: {
          host: dbStatus.host,
          name: dbStatus.name,
          connectionTime: dbStatus.connectionTime,
          version: dbStatus.version
        },
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        { 
          success: false, 
          message: dbStatus.message,
          error: dbStatus.error,
          timestamp: new Date().toISOString()
        }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Database connection test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Database connection test failed: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
} 
