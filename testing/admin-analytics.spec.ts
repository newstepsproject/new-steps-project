import { test, expect } from '@playwright/test';
import { LoginPage } from './login.page';
import { AdminAnalyticsPage } from './admin.page';
import { createPublicDonation, fetchAdminAnalytics, loginWithCredentials } from './helpers/api';

const ADMIN_EMAIL = 'admin@newsteps.fit';
const ADMIN_PASSWORD = 'Admin123!';

async function waitForDonationIncrement(cookie: string, baseline: number) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const snapshot = await fetchAdminAnalytics(cookie);
    if ((snapshot?.donations?.total ?? 0) >= baseline + 1) {
      return snapshot;
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error('Analytics did not reflect new donation within timeout');
}

test('admin analytics reflects newly received donations', async ({ page }) => {
  const adminCookie = await loginWithCredentials(ADMIN_EMAIL, ADMIN_PASSWORD);
  const baseline = await fetchAdminAnalytics(adminCookie);
  const baselineDonations = baseline?.donations?.total ?? 0;

  await createPublicDonation(`Analytics validation donation ${Date.now()}`);
  const updatedAnalytics = await waitForDonationIncrement(adminCookie, baselineDonations);

  const login = new LoginPage(page);
  await login.goto();
  await login.submit(ADMIN_EMAIL, ADMIN_PASSWORD);

  const analyticsPage = new AdminAnalyticsPage(page);
  await analyticsPage.goto();
  const uiSummary = await analyticsPage.summary();

  expect(uiSummary.donationsTotal).toBe(updatedAnalytics.donations.total);
  expect(uiSummary.requestsTotal).toBe(updatedAnalytics.requests.total);
  expect(uiSummary.usersTotal).toBe(updatedAnalytics.users.total);
  expect(uiSummary.moneyTotalAmount).toBeCloseTo(updatedAnalytics.moneyDonations.totalAmount ?? 0, 2);
});
