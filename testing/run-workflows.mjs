#!/usr/bin/env node
import { exit } from 'node:process';
import assert from 'node:assert/strict';

const DEFAULT_TARGET = 'http://localhost:3000';
const USER_EMAIL = 'newsteps.dev@gmail.com';
const USER_PASSWORD = 'TestPass123!';
const ADMIN_EMAIL = 'admin@newsteps.fit';
const ADMIN_PASSWORD = 'Admin123!';

function parseArgs() {
  const opts = { target: DEFAULT_TARGET };
  for (let i = 2; i < process.argv.length; i++) {
    const [key, value] = process.argv[i].split('=');
    if (key === '--target' && value) opts.target = value;
  }
  return opts;
}

async function getCsrf(target) {
  const res = await fetch(`${target}/api/auth/csrf`);
  if (res.status !== 200) {
    throw new Error(`csrf fetch failed: ${res.status}`);
  }
  const data = await res.json();
  const cookieHeader = res.headers.get('set-cookie');
  const cookie = cookieHeader ? cookieHeader.split(';')[0] : null;
  return { csrfToken: data.csrfToken, csrfCookie: cookie };
}

function extractCookies(res) {
  const header = res.headers.get('set-cookie');
  return header ? header.split(/,(?=\s*[^=]+=)/).map((c) => c.trim()) : [];
}

function buildSessionCookie(cookies, email) {
  const sessionCookie = cookies.find((c) => c.includes('session-token'));
  if (!sessionCookie) {
    throw new Error(`no session cookie for ${email}. Cookies: ${cookies.join('; ')}`);
  }
  const callbackCookie = cookies.find((c) => c.startsWith('next-auth.callback-url'));
  return [sessionCookie.split(';')[0], callbackCookie ? callbackCookie.split(';')[0] : null]
    .filter(Boolean)
    .join('; ');
}

async function loginCredentials(target, email, password) {
  const { csrfToken, csrfCookie } = await getCsrf(target);
  const params = new URLSearchParams({
    email,
    password,
    csrfToken,
    callbackUrl: `${target}/account`,
    redirect: 'false',
    json: 'true'
  });
  const res = await fetch(`${target}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(csrfCookie ? { cookie: csrfCookie } : {})
    },
    body: params
  });
  const txt = await res.text();
  if (res.status !== 200) {
    throw new Error(`login failed (${email}): ${res.status} ${txt}`);
  }
  let json;
  try {
    json = JSON.parse(txt);
  } catch (err) {
    throw new Error(`login response not JSON for ${email}: ${txt}`);
  }
  if (json?.error) {
    throw new Error(`login returned error for ${email}: ${JSON.stringify(json)}`);
  }
  const cookies = extractCookies(res);
  return buildSessionCookie(cookies, email);
}

async function assertSession(target, cookie, expectedEmail) {
  const res = await fetch(`${target}/api/auth/session`, { headers: { cookie } });
  if (res.status !== 200) {
    throw new Error(`session check failed: ${res.status}`);
  }
  const data = await res.json();
  assert.equal(data?.user?.email, expectedEmail, 'session email mismatch');
  return data;
}

async function fetchJSON(target, path, cookie) {
  const res = await fetch(`${target}${path}`, {
    headers: cookie ? { cookie } : undefined
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`GET ${path} failed: ${res.status} ${msg}`);
  }
  return res.json();
}

async function submitDonation(target, cookie) {
  const timestamp = Date.now();
  const payload = {
    donationDescription: JSON.stringify([
      { brand: 'Nike', sport: 'soccer', size: '6', condition: 'good', quantity: 1 }
    ]),
    numberOfShoes: 1,
    isBayArea: false,
    firstName: 'Test',
    lastName: `Donor${timestamp}`,
    email: USER_EMAIL,
    phone: '555-000-0000',
    address: {
      street: '1 Test Way',
      city: 'Testville',
      state: 'CA',
      zipCode: '94000',
      country: 'USA'
    }
  };

  const res = await fetch(`${target}/api/donations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie
    },
    body: JSON.stringify(payload)
  });

  if (res.status !== 201) {
    const txt = await res.text();
    throw new Error(`donation submit failed: ${res.status} ${txt}`);
  }
  const data = await res.json();
  assert.ok(data?.donationId, 'missing donationId');
  return data.donationId;
}

async function submitRequest(target, cookie) {
  const shoeResponse = await fetchJSON(target, '/api/shoes', null);
  const shoe = shoeResponse.shoes?.find((s) => s.inventoryCount > 0);
  if (!shoe) {
    throw new Error('No available inventory to request');
  }

  const payload = {
    items: [
      {
        inventoryId: shoe._id,
        brand: shoe.brand,
        name: shoe.modelName || shoe.brand,
        size: shoe.size,
        gender: shoe.gender,
        sport: shoe.sport,
        condition: shoe.condition
      }
    ],
    firstName: 'Request',
    lastName: 'User',
    email: USER_EMAIL,
    phone: '555-111-2222',
    address: '1 Test Way',
    city: 'Testville',
    state: 'CA',
    zipCode: '94000',
    country: 'USA',
    deliveryMethod: 'shipping',
    notes: 'Automated request'
  };

  const res = await fetch(`${target}/api/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie
    },
    body: JSON.stringify(payload)
  });

  if (res.status !== 201 && res.status !== 200) {
    const txt = await res.text();
    throw new Error(`request submit failed: ${res.status} ${txt}`);
  }
  const data = await res.json();
  assert.ok(data?.requestId, 'missing requestId');
  return data.requestId;
}

async function verifyDonationVisible(target, adminCookie, donationId) {
  const data = await fetchJSON(target, `/api/admin/shoe-donations?search=${donationId}`, adminCookie);
  const found = data?.donations?.find?.((d) => d.referenceNumber === donationId);
  assert.ok(found, `donation ${donationId} not found in admin view`);
  return found;
}

async function updateDonationStatus(target, adminCookie, donationId, status) {
  const res = await fetch(`${target}/api/admin/shoe-donations`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      cookie: adminCookie
    },
    body: JSON.stringify({ donationId, status, note: `Automated status ${status}` })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`updateDonationStatus failed: ${res.status} ${txt}`);
  }
  return res.json();
}

async function verifyDonationStatus(target, adminCookie, donationId, expectedStatus) {
  const data = await fetchJSON(target, `/api/admin/shoe-donations?search=${donationId}`, adminCookie);
  const found = data?.donations?.find?.((d) => d.referenceNumber === donationId);
  assert.ok(found, `donation ${donationId} missing after status update`);
  assert.equal(found.status, expectedStatus, `donation status expected ${expectedStatus} got ${found.status}`);
}

async function updateRequestStatus(target, adminCookie, requestId, status, extra = {}) {
  const res = await fetch(`${target}/api/admin/requests`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      cookie: adminCookie
    },
    body: JSON.stringify({ requestId, status, note: `Automated status ${status}`, ...extra })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`updateRequestStatus failed: ${res.status} ${txt}`);
  }
  return res.json();
}

async function verifyRequestStatus(target, cookie, requestId, expectedStatus) {
  const data = await fetchJSON(target, '/api/requests', cookie);
  const found = data?.requests?.find?.((r) => r.requestId === requestId);
  assert.ok(found, `request ${requestId} not found for user`);
  const current = found.currentStatus || found.statusHistory?.[0]?.status;
  assert.equal(current, expectedStatus, `request status expected ${expectedStatus} got ${current}`);
}

async function main() {
  const { target } = parseArgs();
  try {
    const userCookie = await loginCredentials(target, USER_EMAIL, USER_PASSWORD);
    const session = await assertSession(target, userCookie, USER_EMAIL);
    console.log('User session verified. Email verified:', session.user?.emailVerified);

    const donationId = await submitDonation(target, userCookie);
    console.log('Donation submitted:', donationId);

    const requestId = await submitRequest(target, userCookie);
    console.log('Request submitted:', requestId);

    const adminCookie = await loginCredentials(target, ADMIN_EMAIL, ADMIN_PASSWORD);
    await assertSession(target, adminCookie, ADMIN_EMAIL);
    await verifyDonationVisible(target, adminCookie, donationId);
    console.log('Admin can view donation:', donationId);

    await updateDonationStatus(target, adminCookie, donationId, 'received');
    await updateDonationStatus(target, adminCookie, donationId, 'processed');
    await verifyDonationStatus(target, adminCookie, donationId, 'processed');
    console.log('Donation processed by admin:', donationId);

    await updateRequestStatus(target, adminCookie, requestId, 'approved');
    await updateRequestStatus(target, adminCookie, requestId, 'shipped', { trackingNumber: `TRACK-${Date.now()}` });
    await verifyRequestStatus(target, userCookie, requestId, 'shipped');
    console.log('Request fulfilled by admin:', requestId);

    console.log('Workflow tests completed successfully');
  } catch (err) {
    console.error('Workflow test failure:', err);
    exit(1);
  }
}

main();
