import { test, expect } from '@playwright/test';
import { LoginPage } from './login.page';
import { AdminSettingsPage } from './admin.page';
import { fetchAdminSettings, loginWithCredentials } from './helpers/api';

const ADMIN_EMAIL = 'admin@newsteps.fit';
const ADMIN_PASSWORD = 'Admin123!';

function toNumber(value: string | number | undefined) {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value ?? '0');
  return Number.isNaN(parsed) ? 0 : parsed;
}

test('admin can update shipping fee through settings panel', async ({ page }) => {
  const adminCookie = await loginWithCredentials(ADMIN_EMAIL, ADMIN_PASSWORD);
  const login = new LoginPage(page);
  await login.goto();
  await login.submit(ADMIN_EMAIL, ADMIN_PASSWORD);

  const settingsPage = new AdminSettingsPage(page);
  await settingsPage.goto();

  const originalValue = await settingsPage.currentShippingFee();
  const baseline = toNumber(originalValue);
  const newValue = (baseline + 1).toFixed(2);

  await settingsPage.setShippingFee(newValue);
  await settingsPage.saveSystemSettings();

  const updated = await fetchAdminSettings(adminCookie);
  expect(toNumber(updated.settings?.shippingFee)).toBeCloseTo(parseFloat(newValue), 2);

  await settingsPage.setShippingFee(originalValue);
  await settingsPage.saveSystemSettings();

  const reverted = await fetchAdminSettings(adminCookie);
  expect(toNumber(reverted.settings?.shippingFee)).toBeCloseTo(baseline, 2);
});
