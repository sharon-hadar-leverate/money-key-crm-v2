import { Page, Locator, expect } from '@playwright/test'

/**
 * Base page object with common functionality
 */
export class BasePage {
  constructor(protected page: Page) {}

  /**
   * Wait for page to finish loading
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Get toast notification element (using Sonner)
   */
  getToast(): Locator {
    return this.page.locator('[data-sonner-toast]')
  }

  /**
   * Wait for success toast with specific text
   */
  async expectSuccessToast(text: string): Promise<void> {
    // Wait for the network to settle after an action
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
    // Look for toast text - could be in various toast implementations
    await expect(this.page.getByText(text).first()).toBeVisible({ timeout: 10000 })
  }

  /**
   * Wait for error toast with specific text
   */
  async expectErrorToast(text: string): Promise<void> {
    await expect(this.page.getByText(text)).toBeVisible({ timeout: 5000 })
  }

  /**
   * Get the page title from header
   */
  async getPageTitle(): Promise<string> {
    const header = this.page.locator('h1').first()
    return (await header.textContent()) || ''
  }

  /**
   * Click a button by its Hebrew text
   */
  async clickButton(name: string): Promise<void> {
    await this.page.getByRole('button', { name }).click()
  }

  /**
   * Click a link by its Hebrew text
   */
  async clickLink(name: string): Promise<void> {
    await this.page.getByRole('link', { name }).click()
  }

  /**
   * Fill an input field by its Hebrew label
   */
  async fillField(label: string, value: string): Promise<void> {
    const field = this.page.locator(`label:has-text("${label}")`).locator('..').locator('input')
    await field.fill(value)
  }
}
