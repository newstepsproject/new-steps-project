// MongoDB Memory Server for local development and testing
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod = null;
let isConnected = false;

/**
 * Start MongoDB Memory Server and connect to it
 */
async function startDatabase() {
  try {
    if (mongod) {
      console.log('MongoDB Memory Server already running');
      return;
    }
    
    console.log('Starting MongoDB Memory Server...');
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    console.log(`Connecting to MongoDB Memory Server at ${uri}`);
    await mongoose.connect(uri);
    isConnected = true;
    
    console.log('Connected to MongoDB Memory Server');
    
    // Set environment variable so other parts of the app can use it
    process.env.MONGODB_URI = uri;
    
    return uri;
  } catch (error) {
    console.error('Failed to start MongoDB Memory Server:', error);
    throw error;
  }
}

/**
 * Stop MongoDB Memory Server
 */
async function stopDatabase() {
  try {
    if (isConnected) {
      await mongoose.disconnect();
      isConnected = false;
    }
    
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
    // Load models
    const UserModel = require('../models/user').default;
    
    // Create admin user
    const adminUser = new UserModel({
      name: 'Admin User',
      email: 'admin@example.com',
      phone: '1234567890',
      password: '$2b$10$z7l/gKSh8Sx9qGHQ4FXqSO1yiYt3AO9TCsfCkJ7I8HN/6AwJWZzTO', // 'admin123'
      role: 'admin',
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

module.exports = {
  startDatabase,
  stopDatabase,
  seedDatabase
}; 