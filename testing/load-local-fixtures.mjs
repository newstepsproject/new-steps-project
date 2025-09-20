#!/usr/bin/env node
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@newsteps.fit';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

const TOTAL_SHOES = Number(process.env.TOTAL_SHOES || 300);
const TOTAL_USERS = Number(process.env.TOTAL_USERS || 200);

async function getCsrf() {
  const res = await fetch(`${BASE_URL}/api/auth/csrf`);
  if (!res.ok) throw new Error(`csrf fetch failed ${res.status}`);
  const data = await res.json();
  const cookieHeader = res.headers.get('set-cookie');
  const csrfCookie = cookieHeader ? cookieHeader.split(';')[0] : '';
  return { csrfToken: data?.csrfToken, csrfCookie };
}

function parseSetCookie(header) {
  if (!header) return [];
  return header.split(/,(?=\s*[^=]+=)/).map((c) => c.trim());
}

async function loginAdmin() {
  const { csrfToken, csrfCookie } = await getCsrf();
  const params = new URLSearchParams({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    csrfToken,
    callbackUrl: `${BASE_URL}/account`,
    redirect: 'false',
    json: 'true'
  });
  const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(csrfCookie ? { cookie: csrfCookie } : {})
    },
    body: params.toString()
  });
  const bodyText = await res.text();
  if (res.status !== 200) {
    throw new Error(`admin login failed: ${res.status} ${bodyText}`);
  }
  const cookies = parseSetCookie(res.headers.get('set-cookie'));
  const sessionCookie = cookies.find((c) => c.includes('session-token'));
  if (!sessionCookie) {
    throw new Error('no admin session cookie');
  }
  const callbackCookie = cookies.find((c) => c.startsWith('next-auth.callback-url'));
  return [sessionCookie.split(';')[0], callbackCookie ? callbackCookie.split(';')[0] : null]
    .filter(Boolean)
    .join('; ');
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function createShoe(cookie, index) {
  const brands = ['Nike', 'Adidas', 'Puma', 'New Balance', 'Under Armour', 'Asics'];
  const sports = ['running', 'basketball', 'soccer', 'tennis', 'training'];
  const genders = ['men', 'women', 'unisex'];
  const sizes = ['7', '8', '9', '10', '11', '12'];
  const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Gray'];

  const payload = {
    brand: randomFrom(brands),
    modelName: `Automation ${index}`,
    gender: randomFrom(genders),
    size: randomFrom(sizes),
    color: randomFrom(colors),
    sport: randomFrom(sports),
    condition: 'like_new',
    inventoryCount: Math.floor(Math.random() * 3) + 1,
    status: 'available',
    shoeId: 1000 + index
  };

  const res = await fetch(`${BASE_URL}/api/admin/shoes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`create shoe failed (${index}): ${res.status} ${text}`);
  }
}

async function registerUser(index) {
  const email = `bulk-user-${Date.now()}-${index}@example.com`;
  const payload = {
    firstName: 'Bulk',
    lastName: `User${index}`,
    email,
    password: 'BulkUser123!',
    address: {
      street: `${index} Test Avenue`,
      city: 'Testville',
      state: 'CA',
      zipCode: '94000',
      country: 'USA'
    },
    sports: ['soccer', 'running']
  };

  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (res.status !== 201) {
    const text = await res.text();
    throw new Error(`register user failed (${email}): ${res.status} ${text}`);
  }
}

async function main() {
  console.log(`Seeding ${TOTAL_USERS} users and ${TOTAL_SHOES} shoes into ${BASE_URL}`);
  const adminCookie = await loginAdmin();
  console.log('✓ Admin session established');

  let userErrors = 0;
  for (let i = 0; i < TOTAL_USERS; i++) {
    try {
      await registerUser(i);
      if ((i + 1) % 50 === 0) {
        console.log(`  users created: ${i + 1}`);
      }
    } catch (err) {
      userErrors++;
      console.error(err.message);
    }
  }
  console.log(`Users completed with ${userErrors} errors`);

  let shoeErrors = 0;
  for (let i = 0; i < TOTAL_SHOES; i++) {
    try {
      await createShoe(adminCookie, i);
      if ((i + 1) % 50 === 0) {
        console.log(`  shoes created: ${i + 1}`);
      }
    } catch (err) {
      shoeErrors++;
      console.error(err.message);
    }
  }
  console.log(`Shoes completed with ${shoeErrors} errors`);

  console.log('Seeding complete.');
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
