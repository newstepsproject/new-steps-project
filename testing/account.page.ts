import { Page } from '@playwright/test';

export class AccountPage {
  constructor(private readonly page: Page) {}

  async waitForReady() {
    await this.page.waitForSelector('text=My Account', { timeout: 15000 });
  }

  async isEmailVerifiedBannerVisible(): Promise<boolean> {
    const banner = this.page.locator('text=Email not verified');
    return (await banner.count()) > 0;
  }

  async getDonationRows(description: string) {
    return this.page.locator(`text=${description}`);
  }
}
