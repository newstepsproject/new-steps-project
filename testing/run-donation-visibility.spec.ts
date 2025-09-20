import { test, expect } from '@playwright/test';
import { LoginPage } from './login.page';
import { AccountPage } from './account.page';

const USER_EMAIL = 'newsteps.dev@gmail.com';
const USER_PASSWORD = 'TestPass123!';

async function submitDonation(page, description: string) {
  await page.goto('http://localhost:3000/donate/shoes');
  await page.waitForSelector('text=Donate Shoes');

  await page.fill('#firstName', 'Test');
  await page.fill('#lastName', 'Donor');
  await page.fill('#email', USER_EMAIL);
  await page.fill('#street', '1 Test Way');
  await page.fill('#city', 'Testville');
  await page.fill('#state', 'CA');
  await page.fill('#zipCode', '94000');
  await page.fill('#numberOfShoes', '1');
  await page.fill('#donationDescription', description);

  const responsePromise = page.waitForResponse((response) =>
    response.url().includes('/api/donations') && response.status() === 201
  );
  await page.click('button:has-text("Submit Donation")');
  const response = await responsePromise;
  const result = await response.json();
  const card = page.locator('p.font-mono');
  await expect(card).toHaveCount(1);
  const donationId = await card.textContent();
  return donationId?.trim() || result?.donationId;
}

test('new donation appears in account history after submission', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.submit(USER_EMAIL, USER_PASSWORD);

  const account = new AccountPage(page);
  await account.waitForReady();

  const description = `Automated donation ${Date.now()}`;
  const donationId = await submitDonation(page, description);

  await page.goto('http://localhost:3000/account?tab=donations');
  await account.waitForReady();
  await page.click('button:has-text("My Donations")');
  await page.waitForSelector('text=Shoe Donations', { timeout: 15000 });

  const rows = await account.getDonationRows(description);
  await expect(rows).toHaveCount(1);
  if (donationId) {
    const reference = page.locator(`text=${donationId}`);
    await expect(reference).toHaveCount(1);
  }
});
