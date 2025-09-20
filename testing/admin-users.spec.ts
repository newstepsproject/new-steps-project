import { test, expect } from '@playwright/test';
import { LoginPage } from './login.page';
import { AdminUsersPage } from './admin.page';
import { fetchAdminUsers, loginWithCredentials, registerTestUser } from './helpers/api';

const ADMIN_EMAIL = 'admin@newsteps.fit';
const ADMIN_PASSWORD = 'Admin123!';

async function waitForUserInDirectory(cookie: string, email: string, attempts = 10, delayMs = 500) {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const response = await fetchAdminUsers(cookie, email);
    const users = response?.users ?? [];
    if (users.some((user: any) => user.email === email.toLowerCase())) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error(`User ${email} did not appear in admin directory within timeout`);
}

test('admin can locate new registrant and promote role', async ({ page }) => {
  const adminCookie = await loginWithCredentials(ADMIN_EMAIL, ADMIN_PASSWORD);
  const { email } = await registerTestUser();

  await waitForUserInDirectory(adminCookie, email);

  const login = new LoginPage(page);
  await login.goto();
  await login.submit(ADMIN_EMAIL, ADMIN_PASSWORD);

  const usersPage = new AdminUsersPage(page);
  await usersPage.goto();
  await usersPage.search(email);
  await usersPage.waitForRow(email);
  await usersPage.openDetails(email);
  await usersPage.setRole('admin');
  await usersPage.saveChanges();

  await usersPage.search(email);
  await usersPage.waitForRow(email);
  await expect(usersPage.roleLocator(email, 'admin')).toBeVisible({ timeout: 10000 });
});
