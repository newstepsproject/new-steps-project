import { test, expect, request as playwrightRequest } from '@playwright/test';
import { LoginPage } from './login.page';
import { AdminDonationsPage } from './admin.page';

const ADMIN_EMAIL = 'admin@newsteps.fit';
const ADMIN_PASSWORD = 'Admin123!';
const USER_EMAIL = 'newsteps.dev@gmail.com';

async function createDonation(description: string) {
  const api = await playwrightRequest.newContext();
  const res = await api.post('http://localhost:3000/api/donations', {
    data: {
      donationDescription: description,
      numberOfShoes: 1,
      firstName: 'Auto',
      lastName: 'Donor',
      email: USER_EMAIL,
      phone: '555-000-0000',
      address: {
        street: '1 Test Way',
        city: 'Testville',
        state: 'CA',
        zipCode: '94000',
        country: 'USA'
      }
    }
  });
  if (res.status() !== 201) {
    throw new Error(`donation creation failed: ${res.status()}`);
  }
  const json = await res.json();
  await api.dispose();
  return json.donationId || description;
}

test('admin can find donation by search', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.submit(ADMIN_EMAIL, ADMIN_PASSWORD);

  const adminDonations = new AdminDonationsPage(page);
  await adminDonations.goto();

  const description = `Admin search donation ${Date.now()}`;
  const donationId = await createDonation(description);

  await adminDonations.search(donationId);
  expect(await adminDonations.hasResult(donationId)).toBeTruthy();
});
