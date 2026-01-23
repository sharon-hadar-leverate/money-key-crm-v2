import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './base-page'

/**
 * Page object for /leads page
 */
export class LeadsPage extends BasePage {
  readonly newLeadButton: Locator
  readonly leadsTable: Locator
  readonly searchInput: Locator
  readonly filterButton: Locator
  readonly leadsCount: Locator

  constructor(page: Page) {
    super(page)
    this.newLeadButton = page.getByRole('link', { name: 'ליד חדש' })
    this.leadsTable = page.locator('table')
    // Use the leads table search input (has w-full class, vs header search)
    this.searchInput = page.locator('input.search-input.w-full')
    this.filterButton = page.locator('.filter-btn')
    this.leadsCount = page.locator('.number-display').first()
  }

  /**
   * Navigate to leads page
   */
  async goto(): Promise<void> {
    await this.page.goto('/leads')
    await this.waitForPageLoad()
  }

  /**
   * Search for a lead by name
   */
  async searchLead(query: string): Promise<void> {
    await this.searchInput.fill(query)
    // Wait for filtering to apply (client-side filter)
    await this.page.waitForTimeout(500)
  }

  /**
   * Get a specific lead row by name
   */
  getLeadRow(name: string): Locator {
    // Get the row in tbody that contains the name - be specific to avoid header row matches
    return this.leadsTable.locator('tbody tr').filter({ hasText: name }).first()
  }

  /**
   * Check if a lead exists in the table
   */
  async leadExists(name: string): Promise<boolean> {
    const row = this.getLeadRow(name)
    return await row.isVisible()
  }

  /**
   * Click on a lead to navigate to detail page
   */
  async clickLead(name: string): Promise<void> {
    const row = this.getLeadRow(name)
    await row.locator('a').first().click()
  }

  /**
   * Get the status of a lead from the table
   */
  async getLeadStatus(name: string): Promise<string> {
    const row = this.getLeadRow(name)
    const statusBadge = row.locator('[class*="rounded-full"]')
    return (await statusBadge.textContent()) || ''
  }

  /**
   * Open the dropdown menu for a lead
   */
  async openLeadMenu(name: string): Promise<void> {
    const row = this.getLeadRow(name)
    await row.locator('button').last().click()
  }

  /**
   * Change lead status via dropdown menu
   */
  async changeLeadStatusViaMenu(name: string, status: 'contacted' | 'customer' | 'lost'): Promise<void> {
    await this.openLeadMenu(name)
    const statusLabels = {
      contacted: 'סמן כנוצר קשר',
      customer: 'סמן כלקוח',
      lost: 'סמן כאבוד',
    }
    await this.page.getByRole('menuitem', { name: statusLabels[status] }).click()
  }

  /**
   * Delete a lead via dropdown menu
   */
  async deleteLead(name: string): Promise<void> {
    await this.openLeadMenu(name)
    // Handle the confirmation dialog
    this.page.once('dialog', dialog => dialog.accept())
    await this.page.getByRole('menuitem', { name: 'מחק' }).click()
  }

  /**
   * Get total leads count displayed
   */
  async getTotalLeadsCount(): Promise<number> {
    const text = await this.leadsCount.textContent()
    return parseInt(text || '0', 10)
  }

  /**
   * Wait for leads table to be populated
   */
  async waitForLeadsLoaded(): Promise<void> {
    await expect(this.leadsTable.locator('tbody tr').first()).toBeVisible({ timeout: 10000 })
  }

  /**
   * Verify lead appears in table with expected data
   */
  async expectLeadInTable(name: string, options?: { status?: string; revenue?: string }): Promise<void> {
    const row = this.getLeadRow(name)
    await expect(row).toBeVisible()

    if (options?.status) {
      await expect(row.getByText(options.status)).toBeVisible()
    }
  }
}
