import { test, expect } from '@playwright/test';
import { LoginPage } from './login.page';
import { AdminInventoryPage } from './admin.page';
import { createManualShoe, deleteShoe, loginWithCredentials } from './helpers/api';

const ADMIN_EMAIL = 'admin@newsteps.fit';
const ADMIN_PASSWORD = 'Admin123!';

test('admin manual inventory entry is discoverable via inventory search', async ({ page }) => {
  const adminCookie = await loginWithCredentials(ADMIN_EMAIL, ADMIN_PASSWORD);
  const manualResponse = await createManualShoe(adminCookie, {
    brand: 'AutomationBrand',
    modelName: `Automation Model ${Date.now()}`,
    size: '10',
    sport: 'running'
  });

  const shoe = manualResponse?.shoe;
  expect.soft(shoe?.sku).toBeTruthy();
  expect.soft(shoe?._id).toBeTruthy();

  try {
    const login = new LoginPage(page);
    await login.goto();
    await login.submit(ADMIN_EMAIL, ADMIN_PASSWORD);

    const inventoryPage = new AdminInventoryPage(page);
    await inventoryPage.goto();
    const row = inventoryPage.rowContaining(shoe.sku);
    await expect(row).toBeVisible({ timeout: 10_000 });
  } finally {
    if (shoe?._id) {
      await deleteShoe(adminCookie, shoe._id);
    }
  }
});
