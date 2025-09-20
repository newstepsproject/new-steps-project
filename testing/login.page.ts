import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:3000/login');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async submit(email: string, password: string) {
    await this.page.waitForSelector('input[id="email"]', { timeout: 15000 });
    await this.page.fill('input[id="email"]', email);
    await this.page.fill('input[id="password"]', password);
    await Promise.all([
      this.page.waitForURL('**/account', { timeout: 15000 }),
      this.page.click('button:has-text("Sign in")')
    ]);
    await expect(this.page).toHaveURL(/\/account/);
  }
}
