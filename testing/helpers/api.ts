const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function parseSetCookie(header: string | null): string[] {
  if (!header) return [];
  return header.split(/,(?=\s*[^=]+=)/).map((cookie) => cookie.trim());
}

async function getCsrf() {
  const res = await fetch(`${BASE_URL}/api/auth/csrf`);
  if (!res.ok) {
    throw new Error(`Failed to fetch CSRF token: ${res.status}`);
  }
  const data = await res.json();
  const cookieHeader = res.headers.get('set-cookie');
  const csrfCookie = cookieHeader ? cookieHeader.split(';')[0] : '';
  return { csrfToken: data?.csrfToken as string, csrfCookie };
}

export async function loginWithCredentials(email: string, password: string): Promise<string> {
  const { csrfToken, csrfCookie } = await getCsrf();
  const params = new URLSearchParams({
    email,
    password,
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
    throw new Error(`Login failed: ${res.status} ${bodyText}`);
  }

  let json: any;
  try {
    json = JSON.parse(bodyText);
  } catch (error) {
    throw new Error(`Login response not JSON: ${bodyText}`);
  }
  if (json?.error) {
    throw new Error(`Login returned error: ${json.error}`);
  }

  const cookies = parseSetCookie(res.headers.get('set-cookie'));
  const sessionCookie = cookies.find((c) => c.includes('session-token'));
  if (!sessionCookie) {
    throw new Error(`No session cookie returned for ${email}`);
  }
  const callbackCookie = cookies.find((c) => c.startsWith('next-auth.callback-url'));
  return [sessionCookie.split(';')[0], callbackCookie ? callbackCookie.split(';')[0] : null]
    .filter(Boolean)
    .join('; ');
}

export async function fetchAdminAnalytics(cookie: string) {
  const res = await fetch(`${BASE_URL}/api/admin/analytics`, {
    headers: { cookie }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Analytics fetch failed: ${res.status} ${text}`);
  }
  return res.json();
}

export interface ManualShoeInput {
  brand?: string;
  modelName?: string;
  gender?: string;
  size?: string;
  color?: string;
  sport?: string;
  condition?: string;
  description?: string;
  inventoryCount?: number;
  status?: string;
}

export async function createManualShoe(cookie: string, overrides: ManualShoeInput = {}) {
  const payload = {
    brand: 'TestBrand',
    modelName: `Test Model ${Date.now()}`,
    gender: 'unisex',
    size: '9',
    color: 'Black',
    sport: 'basketball',
    condition: 'like_new',
    inventoryCount: 2,
    status: 'available',
    ...overrides
  };

  const res = await fetch(`${BASE_URL}/api/admin/shoes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  if (res.status !== 201) {
    throw new Error(`Manual shoe creation failed: ${res.status} ${text}`);
  }

  return JSON.parse(text);
}

export async function deleteShoe(cookie: string, mongoId: string) {
  const res = await fetch(`${BASE_URL}/api/admin/shoes/${mongoId}`, {
    method: 'DELETE',
    headers: { cookie }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Delete shoe failed: ${res.status} ${text}`);
  }
}

export async function createPublicDonation(description: string) {
  const res = await fetch(`${BASE_URL}/api/donations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      donationDescription: description,
      numberOfShoes: 1,
      firstName: 'Auto',
      lastName: 'Donor',
      email: 'automation@example.com',
      phone: '555-000-0000',
      address: {
        street: '1 Test Way',
        city: 'Testville',
        state: 'CA',
        zipCode: '94000',
        country: 'USA'
      }
    })
  });
  const text = await res.text();
  if (res.status !== 201) {
    throw new Error(`Donation creation failed: ${res.status} ${text}`);
  }
  return JSON.parse(text);
}

export async function fetchAdminSettings(cookie: string) {
  const res = await fetch(`${BASE_URL}/api/admin/settings`, {
    headers: { cookie }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Settings fetch failed: ${res.status} ${text}`);
  }
  return res.json();
}

type RegisterUserPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  schoolName?: string;
  grade?: string;
  sports?: string[];
  sportClub?: string;
};

export async function registerTestUser(overrides: Partial<RegisterUserPayload> = {}) {
  const payload: RegisterUserPayload = {
    firstName: 'Test',
    lastName: 'User',
    email: `ui-user-${Date.now()}@example.com`,
    phone: '555-000-0000',
    password: 'TestPass123!',
    address: {
      street: '1 Automation Way',
      city: 'Testville',
      state: 'CA',
      zipCode: '94000',
      country: 'USA'
    },
    ...overrides
  };

  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  if (res.status !== 201) {
    throw new Error(`Register user failed: ${res.status} ${text}`);
  }

  return { email: payload.email, password: payload.password, firstName: payload.firstName, lastName: payload.lastName };
}

export async function fetchAdminUsers(cookie: string, search?: string) {
  const url = new URL(`${BASE_URL}/api/admin/users`);
  if (search) {
    url.searchParams.set('search', search);
  }

  const res = await fetch(url.toString(), {
    headers: { cookie }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Users fetch failed: ${res.status} ${text}`);
  }

  return res.json();
}
