import { Locator, Page } from '@playwright/test';

export class AdminDonationsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:3000/admin/shoe-donations');
    await this.page.waitForSelector('text=Shoe Donations', { timeout: 15000 });
  }

  async search(term: string) {
    const searchInput = this.page.locator('input[placeholder="Search..."]').nth(1);
    await searchInput.waitFor({ timeout: 15000 });
    await searchInput.fill(term);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1000);
  }

  async hasResult(term: string) {
    await this.page.waitForSelector(`td:has-text("${term}")`, { timeout: 15000 });
    return true;
  }
}

export class AdminAnalyticsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:3000/admin/analytics');
    await this.page.waitForSelector('text=Analytics', { timeout: 15000 });
    await this.page.waitForSelector('[data-testid="analytics-card-donations"] div.text-2xl', {
      timeout: 15000
    });
  }

  private async readCardValue(testId: string): Promise<number> {
    const raw = await this.page
      .locator(`[data-testid="${testId}"] div.text-2xl`)
      .first()
      .innerText();
    const normalized = raw.replace(/[^0-9.-]/g, '');
    return Number(normalized || '0');
  }

  async summary() {
    return {
      donationsTotal: await this.readCardValue('analytics-card-donations'),
      moneyTotalAmount: await this.readCardValue('analytics-card-money'),
      requestsTotal: await this.readCardValue('analytics-card-requests'),
      usersTotal: await this.readCardValue('analytics-card-users')
    };
  }
}

export class AdminInventoryPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:3000/admin/shoes');
    await this.page.waitForSelector('text=Shoe Inventory', { timeout: 15000 });
  }

  async search(term: string) {
    const input = this.page.getByPlaceholder('Search by ID, brand, model or SKU...');
    await input.fill('');
    await input.type(term, { delay: 30 });
    await this.page.waitForTimeout(300);
  }

  async hasResult(term: string) {
    const row = this.rowContaining(term);
    return (await row.count()) > 0;
  }

  rowContaining(term: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: term }).first();
  }
}

export class AdminSettingsPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:3000/admin/settings');
    await this.page.waitForSelector('text=Project Settings', { timeout: 15000 });
    await this.page.getByRole('tab', { name: /System/i }).click();
    await this.page.getByLabel('Shipping Fee ($)').waitFor({ timeout: 15000 });
  }

  async setShippingFee(value: string) {
    const input = this.page.getByLabel('Shipping Fee ($)');
    await input.fill('');
    await input.type(value);
  }

  async currentShippingFee() {
    const input = this.page.getByLabel('Shipping Fee ($)');
    return input.inputValue();
  }

  async saveSystemSettings() {
    await this.page.getByRole('button', { name: /Save System Settings/i }).click();
    await this.page.waitForSelector('text=Settings saved', { timeout: 15000 });
  }
}

export class AdminVolunteersPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:3000/admin/volunteers');
    await this.page.waitForSelector('text=Volunteer Management', { timeout: 15000 });
  }

  rowsByStatus(status: 'pending' | 'approved' | 'rejected') {
    return this.page.locator('tbody tr').filter({ hasText: new RegExp(status, 'i') });
  }

  rowByStatus(status: 'pending' | 'approved' | 'rejected') {
    return this.rowsByStatus(status).first();
  }

  async approveFirstPending() {
    const row = this.rowByStatus('pending');
    await row.getByRole('button', { name: /approve/i }).click();
    return row;
  }

  async contactFirstApproved() {
    const row = this.rowByStatus('approved');
    await row.getByRole('button', { name: /contact/i }).click();
  }
}

export class AdminUsersPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:3000/admin/users');
    await this.page.waitForSelector('text=User Management', { timeout: 15000 });
  }

  async search(term: string) {
    const input = this.page.locator('input[placeholder="Search..."]:visible').first();
    await input.waitFor({ state: 'visible', timeout: 15000 });
    await input.scrollIntoViewIfNeeded();
    await input.fill(term);
    await this.page.waitForTimeout(300);
  }

  rowByEmail(email: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: email }).first();
  }

  async waitForRow(email: string) {
    await this.rowByEmail(email).waitFor({ state: 'visible', timeout: 15000 });
  }

  async openDetails(email: string) {
    await this.waitForRow(email);
    await this.rowByEmail(email).getByRole('button', { name: /View Details/i }).click();
  }

  async setRole(role: string) {
    await this.page.locator('select#role').selectOption(role);
  }

  async saveChanges() {
    await this.page.getByRole('button', { name: /Save Changes/i }).click();
    await this.page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 15000 });
  }

  roleLocator(email: string, role: string): Locator {
    return this.rowByEmail(email).locator(`text=${role}`);
  }
}
