#!/usr/bin/env node

/**
 * CREATE SAMPLE DATA FOR PRODUCTION TESTING
 * Generate realistic test data for comprehensive testing
 */

const API_BASE = 'http://localhost:3000';

// Sample data configuration
const sampleUsers = [
  { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.test@example.com', password: 'TestPass123' },
  { firstName: 'Mike', lastName: 'Chen', email: 'mike.test@example.com', password: 'TestPass123' },
  { firstName: 'Elena', lastName: 'Rodriguez', email: 'elena.test@example.com', password: 'TestPass123' }
];

const sampleDonations = [
  {
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@example.com',
    phone: '4155551234',
    donationDescription: 'Two pairs of Nike soccer cleats - size 9 (men) and size 8 (men), both in good condition',
    numberOfShoes: 2,
    isBayArea: true
  },
  {
    firstName: 'Lisa',
    lastName: 'Brown',
    email: 'lisa.brown@example.com',
    phone: '6505559876',
    donationDescription: 'Adidas basketball shoes size 10.5 (men), excellent condition, barely used',
    numberOfShoes: 1,
    isBayArea: false
  },
  {
    firstName: 'Carlos',
    lastName: 'Garcia',
    email: 'carlos.garcia@example.com',
    phone: '5109555432',
    donationDescription: 'Three pairs of running shoes - Nike Air Max size 8.5, Asics Gel size 9, Under Armour size 8.5',
    numberOfShoes: 3,
    isBayArea: true
  }
];

const sampleMoneyDonations = [
  { firstName: 'Jennifer', lastName: 'Kim', email: 'jennifer.kim@example.com', phone: '4155552468', amount: 25 },
  { firstName: 'Robert', lastName: 'Taylor', email: 'robert.taylor@example.com', phone: '6505554321', amount: 50 },
  { firstName: 'Maria', lastName: 'Santos', email: 'maria.santos@example.com', phone: '5109556789', amount: 100 }
];

const sampleVolunteers = [
  {
    firstName: 'Alex',
    lastName: 'Thompson',
    email: 'alex.volunteer@example.com',
    phone: '4155553210',
    interests: ['sorting_shoes', 'events'],
    availability: 'weekends',
    experience: 'Previous volunteer experience with local food bank'
  },
  {
    firstName: 'Jordan',
    lastName: 'Lee',
    email: 'jordan.volunteer@example.com',
    phone: '6505557890',
    interests: ['delivery', 'admin'],
    availability: 'flexible',
    experience: 'New to volunteering but very motivated'
  }
];

// Utility function
async function makeRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const defaultOptions = {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.text();
    return {
      status: response.status,
      ok: response.ok,
      data: data ? JSON.parse(data) : null
    };
  } catch (error) {
    return { status: 0, ok: false, error: error.message };
  }
}

async function createSampleUsers() {
  console.log('\n👥 CREATING SAMPLE USERS');
  let created = 0;
  
  for (const user of sampleUsers) {
    console.log(`🔍 Creating user: ${user.firstName} ${user.lastName} (${user.email})`);
    
    const result = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(user)
    });
    
    if (result.status === 201) {
      console.log(`✅ User created successfully`);
      created++;
    } else if (result.status === 400 && result.data?.error?.includes('already exists')) {
      console.log(`ℹ️  User already exists - skipping`);
      created++;
    } else {
      console.log(`❌ Failed to create user: ${result.data?.error || 'Unknown error'}`);
    }
  }
  
  console.log(`📊 Users: ${created}/${sampleUsers.length} ready`);
  return created;
}

async function createSampleDonations() {
  console.log('\n🎁 CREATING SAMPLE SHOE DONATIONS');
  let created = 0;
  const donationIds = [];
  
  for (const donation of sampleDonations) {
    console.log(`🔍 Creating donation from: ${donation.firstName} ${donation.lastName}`);
    
    const result = await makeRequest('/api/donations', {
      method: 'POST',
      body: JSON.stringify(donation)
    });
    
    if (result.status === 201) {
      console.log(`✅ Donation created: ${result.data.donationId}`);
      donationIds.push(result.data.donationId);
      created++;
    } else {
      console.log(`❌ Failed to create donation: ${result.data?.error || 'Unknown error'}`);
    }
  }
  
  console.log(`📊 Donations: ${created}/${sampleDonations.length} created`);
  return { created, donationIds };
}

async function createSampleMoneyDonations() {
  console.log('\n💰 CREATING SAMPLE MONEY DONATIONS');
  let created = 0;
  const donationIds = [];
  
  for (const donation of sampleMoneyDonations) {
    console.log(`🔍 Creating money donation from: ${donation.firstName} ${donation.lastName} ($${donation.amount})`);
    
    const result = await makeRequest('/api/donations/money', {
      method: 'POST',
      body: JSON.stringify(donation)
    });
    
    if (result.status === 201) {
      console.log(`✅ Money donation created: ${result.data.donationId}`);
      donationIds.push(result.data.donationId);
      created++;
    } else {
      console.log(`❌ Failed to create money donation: ${result.data?.error || 'Unknown error'}`);
    }
  }
  
  console.log(`📊 Money Donations: ${created}/${sampleMoneyDonations.length} created`);
  return { created, donationIds };
}

async function createSampleVolunteers() {
  console.log('\n🤝 CREATING SAMPLE VOLUNTEERS');
  let created = 0;
  
  for (const volunteer of sampleVolunteers) {
    console.log(`🔍 Creating volunteer: ${volunteer.firstName} ${volunteer.lastName}`);
    
    const result = await makeRequest('/api/volunteers', {
      method: 'POST',
      body: JSON.stringify(volunteer)
    });
    
    if (result.status === 201) {
      console.log(`✅ Volunteer created successfully`);
      created++;
    } else {
      console.log(`❌ Failed to create volunteer: ${result.data?.error || 'Unknown error'}`);
    }
  }
  
  console.log(`📊 Volunteers: ${created}/${sampleVolunteers.length} created`);
  return created;
}

async function createSampleContacts() {
  console.log('\n📞 CREATING SAMPLE CONTACT SUBMISSIONS');
  
  const contacts = [
    {
      firstName: 'Emma',
      lastName: 'Davis',
      email: 'emma.davis@example.com',
      subject: 'Partnership Inquiry',
      message: 'Hi, I represent a local soccer club and we would like to partner with your organization to help distribute shoes to our young players who need them.'
    },
    {
      firstName: 'James',
      lastName: 'Miller',
      email: 'james.miller@example.com', 
      subject: 'Volunteer Question',
      message: 'I am interested in volunteering with your organization. Do you have opportunities for someone who can help with logistics and transportation?'
    }
  ];
  
  let created = 0;
  for (const contact of contacts) {
    console.log(`🔍 Creating contact: ${contact.subject}`);
    
    const result = await makeRequest('/api/contact', {
      method: 'POST',
      body: JSON.stringify(contact)
    });
    
    if (result.status === 200) {
      console.log(`✅ Contact submission created`);
      created++;
    } else {
      console.log(`❌ Failed to create contact: ${result.data?.error || 'Unknown error'}`);
    }
  }
  
  console.log(`📊 Contacts: ${created}/${contacts.length} created`);
  return created;
}

async function createAllSampleData() {
  console.log('🚀 CREATING COMPREHENSIVE SAMPLE DATA FOR PRODUCTION TESTING');
  console.log('=' .repeat(70));
  
  const results = {
    users: await createSampleUsers(),
    donations: await createSampleDonations(),
    moneyDonations: await createSampleMoneyDonations(),
    volunteers: await createSampleVolunteers(),
    contacts: await createSampleContacts()
  };
  
  console.log('\n' + '=' .repeat(70));
  console.log('📊 SAMPLE DATA CREATION RESULTS:');
  console.log('=' .repeat(70));
  
  console.log(`USERS             : ✅ ${results.users} created`);
  console.log(`SHOE DONATIONS    : ✅ ${results.donations.created} created`);
  console.log(`MONEY DONATIONS   : ✅ ${results.moneyDonations.created} created`);
  console.log(`VOLUNTEERS        : ✅ ${results.volunteers} created`);
  console.log(`CONTACTS          : ✅ ${results.contacts} created`);
  
  console.log('=' .repeat(70));
  console.log('🎉 SAMPLE DATA CREATION COMPLETE!');
  console.log('\n📋 NEXT STEPS FOR MANUAL TESTING:');
  console.log('1. Login to admin console: http://localhost:3000/admin');
  console.log('2. Use credentials: admin@newsteps.fit / Admin123!');
  console.log('3. Process donations and add shoes to inventory');
  console.log('4. Test user requests and admin shipping workflow');
  console.log('5. Verify all email notifications');
  
  return results;
}

// Execute if run directly
if (require.main === module) {
  createAllSampleData().catch(console.error);
}

module.exports = { createAllSampleData }; 