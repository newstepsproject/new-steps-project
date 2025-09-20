import { test, expect } from '@playwright/test';
import { LoginPage } from './login.page';
import { AccountPage } from './account.page';

const USER_EMAIL = 'newsteps.dev@gmail.com';
const USER_PASSWORD = 'TestPass123!';

test('account page shows verified state without banner', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.submit(USER_EMAIL, USER_PASSWORD);

  const account = new AccountPage(page);
  await account.waitForReady();

  await page.waitForLoadState('networkidle');

  expect(await account.isEmailVerifiedBannerVisible()).toBeFalsy();
  const verifiedBadge = page.locator('text=Email verified');
  await expect(verifiedBadge).toHaveCount(1);
});
