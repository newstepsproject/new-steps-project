import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@newsteps.fit';
const ADMIN_PASSWORD = 'Admin123!';

async function getCsrf() {
  const res = await fetch(`${BASE_URL}/api/auth/csrf`);
  if (!res.ok) {
    throw new Error(`csrf fetch failed: ${res.status}`);
  }
  const data = await res.json();
  const cookieHeader = res.headers.get('set-cookie');
  const cookie = cookieHeader ? cookieHeader.split(';')[0] : null;
  return { csrfToken: data.csrfToken, csrfCookie: cookie };
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
    body: params
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`admin login failed: ${res.status} ${txt}`);
  }
  const cookies = res.headers.get('set-cookie');
  if (!cookies) {
    throw new Error('no cookies returned for admin login');
  }
  const parts = cookies.split(/,(?=\s*[^=]+=)/).map((c) => c.trim());
  const session = parts.find((c) => c.includes('session-token'));
  const callback = parts.find((c) => c.startsWith('next-auth.callback-url'));
  return [session ? session.split(';')[0] : null, callback ? callback.split(';')[0] : null]
    .filter(Boolean)
    .join('; ');
}

async function ensureInventory() {
  const existingRes = await fetch(`${BASE_URL}/api/shoes`);
  if (!existingRes.ok) {
    throw new Error('failed to fetch shoes');
  }
  const existing = await existingRes.json();
  if (existing?.shoes?.length) {
    return;
  }

  const adminCookie = await loginAdmin();
  const payload = {
    brand: 'AutoBrand',
    modelName: `Automation-${Date.now()}`,
    size: '9',
    color: 'Blue',
    sport: 'soccer',
    gender: 'unisex',
    condition: 'good',
    images: ['/images/shoes/placeholder-shoe.jpg'],
    status: 'available',
    inventoryCount: 1
  };

  const res = await fetch(`${BASE_URL}/api/admin/shoes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: adminCookie
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`inventory creation failed: ${res.status} ${txt}`);
  }
}

test('visitor adds shoe to cart and must sign in to checkout', async ({ page }) => {
  await ensureInventory();
  await page.goto(`${BASE_URL}/shoes`);
  const addButton = page.locator('button:has-text("Add to Cart"), button:has-text("Request")').first();
  await addButton.waitFor({ timeout: 15000 });
  await addButton.click();
  await expect(page.locator('text=Added to Cart')).toHaveCount(1, { timeout: 5000 });

  await page.goto(`${BASE_URL}/cart`);
  await expect(page.getByRole('heading', { name: 'Your Cart' }).first()).toBeVisible();
  const proceed = page.locator('a:has-text("Proceed to Checkout"), button:has-text("Proceed to Checkout")');
  await proceed.click();
  await expect(page).toHaveURL(/\/login/);
});
