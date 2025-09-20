import { test, expect } from '@playwright/test';
import { LoginPage } from './login.page';
import { AdminVolunteersPage } from './admin.page';

const ADMIN_EMAIL = 'admin@newsteps.fit';
const ADMIN_PASSWORD = 'Admin123!';

test('admin can approve and contact volunteers from the queue', async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.submit(ADMIN_EMAIL, ADMIN_PASSWORD);

  const volunteersPage = new AdminVolunteersPage(page);
  await volunteersPage.goto();

  await volunteersPage.approveFirstPending();
  await expect(volunteersPage.rowsByStatus('pending')).toHaveCount(0);

  await volunteersPage.contactFirstApproved();
  await expect(page.getByTestId('volunteer-feedback')).toHaveText(/Contact Volunteer/i);
});
