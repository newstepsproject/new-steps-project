import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Import models
import User from '@/models/user';
import Shoe from '@/models/shoe';
import ShoeDonation from '@/models/donation';
import MoneyDonation from '@/models/MoneyDonation';
import Request from '@/models/shoeRequest';
import Order from '@/models/order';

// Test data
const testUsers = [
  {
    email: 'admin@test.com',
    password: 'Admin123!',
    name: 'Test Admin',
    phone: '+1234567890',
    role: 'admin',
    emailVerified: true
  },
  {
    email: 'user1@test.com',
    password: 'User123!',
    name: 'Test User 1',
    phone: '+1234567891',
    role: 'user',
    emailVerified: true
  },
  {
    email: 'user2@test.com',
    password: 'User123!',
    name: 'Test User 2',
    phone: '+1234567892',
    role: 'user',
    emailVerified: true
  }
];

const testShoes = [
  {
    brand: 'Nike',
    modelName: 'Air Max 90',
    sku: 'NIKE-AM90-001',
    size: '10',
    gender: 'men',
    sport: 'Running',
    color: 'Black/White',
    condition: 'like_new',
    status: 'available',
    inventoryCount: 5,
    images: ['https://example.com/nike-am90.jpg'],
    description: 'Classic Nike Air Max 90 running shoes'
  },
  {
    brand: 'Adidas',
    modelName: 'Ultraboost 22',
    sku: 'ADIDAS-UB22-001',
    size: '9',
    gender: 'women',
    sport: 'Running',
    color: 'Pink/Gray',
    condition: 'good',
    status: 'available',
    inventoryCount: 3,
    images: ['https://example.com/adidas-ub22.jpg'],
    description: 'Comfortable Adidas Ultraboost running shoes'
  },
  {
    brand: 'Puma',
    modelName: 'Future Rider',
    sku: 'PUMA-FR-001',
    size: '11',
    gender: 'men',
    sport: 'Lifestyle',
    color: 'Blue/Yellow',
    condition: 'good',
    status: 'available',
    inventoryCount: 0,
    images: ['https://example.com/puma-fr.jpg'],
    description: 'Stylish Puma Future Rider sneakers'
  }
];

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function clearDatabase() {
  console.log('\n=== Clearing existing test data ===');
  
  try {
    // Only delete test data (emails containing @test.com)
    await User.deleteMany({ email: { $regex: '@test.com' } });
    await Shoe.deleteMany({ sku: { $regex: 'TEST-|NIKE-|ADIDAS-|PUMA-' } });
    await ShoeDonation.deleteMany({});
    await MoneyDonation.deleteMany({});
    await Request.deleteMany({});
    await Order.deleteMany({});
    
    console.log('✓ Cleared test data');
  } catch (error) {
    console.error('✗ Error clearing data:', error);
  }
}

async function seedUsers() {
  console.log('\n=== Seeding Users ===');
  
  const createdUsers = [];
  
  for (const userData of testUsers) {
    try {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = await User.create({
        ...userData,
        password: hashedPassword
      });
      createdUsers.push(user);
      console.log(`✓ Created ${userData.role}: ${userData.email}`);
    } catch (error) {
      console.error(`✗ Error creating user ${userData.email}:`, error);
    }
  }
  
  return createdUsers;
}

async function seedShoes() {
  console.log('\n=== Seeding Shoes ===');
  
  const createdShoes = [];
  
  for (const shoeData of testShoes) {
    try {
      const shoe = await Shoe.create(shoeData);
      createdShoes.push(shoe);
      console.log(`✓ Created shoe: ${shoeData.brand} ${shoeData.modelName}`);
    } catch (error) {
      console.error(`✗ Error creating shoe:`, error);
    }
  }
  
  return createdShoes;
}

async function seedDonations(users: any[]) {
  console.log('\n=== Seeding Donations ===');
  
  // Shoe donations
  const shoeDonations = [
    {
      userId: users[1]._id,
      userName: users[1].name,
      userEmail: users[1].email,
      phoneNumber: '+1234567890',
      address: '123 Test St, Test City, TC 12345',
      numberOfShoes: 2,
      shoeDetails: 'Two pairs of gently used running shoes',
      status: 'submitted',
      statusHistory: [{
        status: 'submitted',
        timestamp: new Date(),
        notes: 'Initial submission'
      }]
    },
    {
      userId: users[2]._id,
      userName: users[2].name,
      userEmail: users[2].email,
      phoneNumber: '+0987654321',
      address: '456 Demo Ave, Demo City, DC 54321',
      numberOfShoes: 3,
      shoeDetails: 'Three pairs of basketball shoes in good condition',
      status: 'picked_up',
      statusHistory: [
        {
          status: 'submitted',
          timestamp: new Date(Date.now() - 86400000),
          notes: 'Initial submission'
        },
        {
          status: 'picked_up',
          timestamp: new Date(),
          notes: 'Picked up by volunteer'
        }
      ]
    }
  ];
  
  for (const donation of shoeDonations) {
    try {
      await ShoeDonation.create(donation);
      console.log(`✓ Created shoe donation from ${donation.userName}`);
    } catch (error) {
      console.error(`✗ Error creating shoe donation:`, error);
    }
  }
  
  // Money donations
  const moneyDonations = [
    {
      userId: users[1]._id,
      userName: users[1].name,
      userEmail: users[1].email,
      amount: 50,
      currency: 'USD',
      paymentMethod: 'credit_card',
      status: 'completed',
      transactionId: `TEST-${Date.now()}-1`
    },
    {
      userId: users[2]._id,
      userName: users[2].name,
      userEmail: users[2].email,
      amount: 100,
      currency: 'USD',
      paymentMethod: 'paypal',
      status: 'pending',
      transactionId: `TEST-${Date.now()}-2`
    }
  ];
  
  for (const donation of moneyDonations) {
    try {
      await MoneyDonation.create(donation);
      console.log(`✓ Created money donation from ${donation.userName}: $${donation.amount}`);
    } catch (error) {
      console.error(`✗ Error creating money donation:`, error);
    }
  }
}

async function seedRequests(users: any[], shoes: any[]) {
  console.log('\n=== Seeding Requests ===');
  
  const requests = [
    {
      userId: users[1]._id,
      userName: users[1].name,
      userEmail: users[1].email,
      phoneNumber: '+1234567890',
      shippingAddress: '123 Test St, Test City, TC 12345',
      shoeSize: '10',
      shoeGender: 'Men',
      shoeSport: 'Running',
      urgency: 'medium',
      reason: 'Need running shoes for marathon training',
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        notes: 'Request submitted'
      }]
    },
    {
      userId: users[2]._id,
      userName: users[2].name,
      userEmail: users[2].email,
      phoneNumber: '+0987654321',
      shippingAddress: '456 Demo Ave, Demo City, DC 54321',
      shoeSize: '9',
      shoeGender: 'Women',
      shoeSport: 'Running',
      urgency: 'high',
      reason: 'Lost shoes in flood, need replacement urgently',
      status: 'approved',
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(Date.now() - 86400000),
          notes: 'Request submitted'
        },
        {
          status: 'approved',
          timestamp: new Date(),
          notes: 'Approved by admin',
          updatedBy: users[0]._id
        }
      ]
    }
  ];
  
  for (const request of requests) {
    try {
      await Request.create(request);
      console.log(`✓ Created request from ${request.userName}`);
    } catch (error) {
      console.error(`✗ Error creating request:`, error);
    }
  }
}

async function seedOrders(users: any[], shoes: any[]) {
  console.log('\n=== Seeding Orders ===');
  
  const orders = [
    {
      userId: users[1]._id,
      userName: users[1].name,
      userEmail: users[1].email,
      items: [{
        shoeId: shoes[0]._id,
        brand: shoes[0].brand,
        modelName: shoes[0].modelName,
        size: shoes[0].size,
        quantity: 1
      }],
      shippingAddress: '123 Test St, Test City, TC 12345',
      phoneNumber: '+1234567890',
      totalAmount: 0,
      status: 'pending',
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        notes: 'Order placed'
      }]
    },
    {
      userId: users[2]._id,
      userName: users[2].name,
      userEmail: users[2].email,
      items: [{
        shoeId: shoes[1]._id,
        brand: shoes[1].brand,
        modelName: shoes[1].modelName,
        size: shoes[1].size,
        quantity: 1
      }],
      shippingAddress: '456 Demo Ave, Demo City, DC 54321',
      phoneNumber: '+0987654321',
      totalAmount: 0,
      status: 'shipped',
      trackingNumber: 'TEST123456789',
      statusHistory: [
        {
          status: 'pending',
          timestamp: new Date(Date.now() - 172800000),
          notes: 'Order placed'
        },
        {
          status: 'confirmed',
          timestamp: new Date(Date.now() - 86400000),
          notes: 'Order confirmed',
          updatedBy: users[0]._id
        },
        {
          status: 'shipped',
          timestamp: new Date(),
          notes: 'Order shipped',
          updatedBy: users[0]._id
        }
      ]
    }
  ];
  
  for (const order of orders) {
    try {
      await Order.create(order);
      console.log(`✓ Created order for ${order.userName}`);
    } catch (error) {
      console.error(`✗ Error creating order:`, error);
    }
  }
}

async function main() {
  console.log('🌱 Starting database seeding...\n');
  
  await connectDB();
  
  // Ask for confirmation
  console.log('⚠️  This will clear existing test data and create new test data.');
  console.log('   Press Ctrl+C to cancel or wait 3 seconds to continue...\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await clearDatabase();
  
  const users = await seedUsers();
  const shoes = await seedShoes();
  await seedDonations(users);
  await seedRequests(users, shoes);
  await seedOrders(users, shoes);
  
  console.log('\n✅ Database seeding complete!');
  console.log('\n📝 Test Accounts:');
  console.log('   Admin: admin@test.com / Admin123!');
  console.log('   User1: user1@test.com / User123!');
  console.log('   User2: user2@test.com / User123!');
  
  await mongoose.disconnect();
  process.exit(0);
}

// Run the seeding
main().catch(error => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
}); 