import { NextResponse } from 'next/server';
import { testDatabaseConnection } from '@/lib/db';

export async function GET() {
  // Simple health check
  try {
    // Check database connection
    const dbStatus = await testDatabaseConnection();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      databaseConnection: dbStatus.success ? 'connected' : 'disconnected',
      databaseDetails: dbStatus
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 