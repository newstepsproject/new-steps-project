import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '@/lib/db';
import UserModel from '@/models/user';
import VerificationToken from '@/models/verification-token';

interface TestDetail {
  status: 'pending' | 'success' | 'error' | 'warning';
  details: Record<string, any>;
}

interface TestResults {
  success: boolean;
  mongodbUri: string;
  tests: {
    connection?: TestDetail;
    userModel?: TestDetail;
    verificationTokenModel?: TestDetail;
    emailConfig?: TestDetail;
    [key: string]: TestDetail | undefined;
  };
  errors: string[];
}

export async function GET() {
  const results: TestResults = {
    success: false,
    mongodbUri: process.env.MONGODB_URI ? 
      process.env.MONGODB_URI.replace(/mongodb(\+srv)?:\/\/[^:]*:[^@]*@/, 'mongodb$1://****:****@') : 
      'not set',
    tests: {},
    errors: []
  };
  
  try {
    // Test database connection
    results.tests.connection = {
      status: 'pending',
      details: {}
    };
    
    await connectToDatabase();
    
    const conn = mongoose.connection;
    if (results.tests.connection) {
      results.tests.connection.status = 'success';
      results.tests.connection.details = {
        readyState: conn.readyState,
        host: conn.host,
        name: conn.name,
        port: conn.port
      };
    }
    
    // Test User model
    results.tests.userModel = {
      status: 'pending',
      details: {}
    };
    
    try {
      const modelInfo = UserModel.schema.obj;
      if (results.tests.userModel) {
        results.tests.userModel.status = 'success';
        results.tests.userModel.details = {
          collectionName: UserModel.collection.name,
          schemaFields: Object.keys(modelInfo)
        };
      }
    } catch (userModelError: unknown) {
      const errorMessage = userModelError instanceof Error ? userModelError.message : 'Unknown error';
      if (results.tests.userModel) {
        results.tests.userModel.status = 'error';
        results.tests.userModel.details.error = errorMessage;
      }
      results.errors.push(`User model error: ${errorMessage}`);
    }
    
    // Test VerificationToken model
    results.tests.verificationTokenModel = {
      status: 'pending',
      details: {}
    };
    
    try {
      const modelInfo = VerificationToken.schema.obj;
      if (results.tests.verificationTokenModel) {
        results.tests.verificationTokenModel.status = 'success';
        results.tests.verificationTokenModel.details = {
          collectionName: VerificationToken.collection.name,
          schemaFields: Object.keys(modelInfo)
        };
      }
    } catch (tokenModelError: unknown) {
      const errorMessage = tokenModelError instanceof Error ? tokenModelError.message : 'Unknown error';
      if (results.tests.verificationTokenModel) {
        results.tests.verificationTokenModel.status = 'error';
        results.tests.verificationTokenModel.details.error = errorMessage;
      }
      results.errors.push(`VerificationToken model error: ${errorMessage}`);
    }
    
    // Test Email Configuration
    results.tests.emailConfig = {
      status: 'pending',
      details: {}
    };
    
    const emailConfigKeys = [
      'EMAIL_SERVER',
      'EMAIL_PORT',
      'EMAIL_USERNAME',
      'EMAIL_PASSWORD',
      'EMAIL_FROM'
    ];
    
    const emailConfig: Record<string, string> = {};
    let hasAllEmailConfig = true;
    
    for (const key of emailConfigKeys) {
      const value = process.env[key];
      emailConfig[key] = value ? (key === 'EMAIL_PASSWORD' ? '[REDACTED]' : value) : 'not set';
      if (!value) {
        hasAllEmailConfig = false;
      }
    }
    
    if (results.tests.emailConfig) {
      results.tests.emailConfig.status = hasAllEmailConfig ? 'success' : 'warning';
      results.tests.emailConfig.details = emailConfig;
    }
    
    if (!hasAllEmailConfig) {
      results.errors.push('Some email configuration values are missing');
    }
    
    // Overall result
    results.success = results.errors.length === 0;
    
    return NextResponse.json(results, { 
      status: results.success ? 200 : 500 
    });
  } catch (error: unknown) {
    results.success = false;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.errors.push(errorMessage);
    
    return NextResponse.json(results, { status: 500 });
  }
} 