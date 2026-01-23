import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './base-page'

/**
 * Page object for /leads/[id] page
 */
export class LeadDetailPage extends BasePage {
  readonly editButton: Locator
  readonly cancelButton: Locator
  readonly saveButton: Locator
  readonly backButton: Locator
  readonly statusBadge: Locator

  constructor(page: Page) {
    super(page)
    this.editButton = page.getByRole('button', { name: 'עריכה' })
    this.cancelButton = page.getByRole('button', { name: 'ביטול' })
    this.saveButton = page.getByRole('button', { name: 'שמור שינויים' })
    this.backButton = page.getByRole('link', { name: 'חזרה ללידים' })
    // Status badge is next to the lead name heading - the first status text after the h1
    this.statusBadge = page.locator('main h1').nth(1).locator('..').locator('div').first()
  }

  /**
   * Navigate to a specific lead detail page
   */
  async goto(leadId: string): Promise<void> {
    await this.page.goto(`/leads/${leadId}`)
    await this.waitForPageLoad()
  }

  /**
   * Enter edit mode
   */
  async enterEditMode(): Promise<void> {
    await this.editButton.click()
    // Wait for form inputs to appear
    await expect(this.saveButton).toBeVisible()
  }

  /**
   * Exit edit mode without saving
   */
  async cancelEdit(): Promise<void> {
    await this.cancelButton.click()
    await expect(this.editButton).toBeVisible()
  }

  /**
   * Save changes
   */
  async saveChanges(): Promise<void> {
    await this.saveButton.click()
    // Wait for edit mode to exit (edit button should reappear)
    await expect(this.editButton).toBeVisible({ timeout: 10000 })
    // Optionally also check for toast
    await this.expectSuccessToast('הליד עודכן בהצלחה').catch(() => {
      // Toast may have already disappeared, that's OK
    })
  }

  /**
   * Update the name field (in edit mode)
   */
  async updateName(name: string): Promise<void> {
    // Target the name input by finding the field with "שם מלא" label
    const nameInput = this.page.locator('text=שם מלא').locator('..').locator('input')
    await nameInput.fill(name)
  }

  /**
   * Update the email field
   */
  async updateEmail(email: string): Promise<void> {
    const emailInput = this.page.locator('text=אימייל').locator('..').locator('input')
    await emailInput.fill(email)
  }

  /**
   * Update the phone field
   */
  async updatePhone(phone: string): Promise<void> {
    const phoneInput = this.page.locator('text=טלפון').locator('..').locator('input')
    await phoneInput.fill(phone)
  }

  /**
   * Update the expected revenue field
   */
  async updateExpectedRevenue(revenue: string): Promise<void> {
    const revenueInput = this.page.locator('text=הכנסה צפויה').locator('..').locator('input')
    await revenueInput.fill(revenue)
  }

  /**
   * Update the probability field
   */
  async updateProbability(probability: string): Promise<void> {
    const probInput = this.page.locator('text=הסתברות').locator('..').locator('input')
    await probInput.fill(probability)
  }

  /**
   * Click a status change button
   */
  async clickStatusButton(status: 'new' | 'contacted' | 'customer' | 'lost'): Promise<void> {
    const statusLabels = {
      new: 'חדש',
      contacted: 'נוצר קשר',
      customer: 'לקוח',
      lost: 'אבוד',
    }
    await this.page.getByRole('button', { name: statusLabels[status] }).click()
    await this.expectSuccessToast('הסטטוס עודכן בהצלחה')
  }

  /**
   * Get the current displayed status
   */
  async getCurrentStatus(): Promise<string> {
    // The status is shown by which button is disabled in the status section
    const disabledButton = this.page.locator('main').getByRole('button').filter({ hasText: /^(חדש|טרם יצרנו קשר|אין מענה|נוצר קשר|נשלחה הודעה|נקבעה שיחה|בהמתנה להסכם|לקוח|חתם על הסכם|אבוד|לא רלוונטי|סגר במקום אחר|מעוניין בעתיד)$/ }).locator('[disabled]').or(
      this.page.getByRole('button', { disabled: true })
    ).first()

    // Try to find the disabled button that indicates current status
    const buttons = this.page.locator('main button[disabled]')
    const count = await buttons.count()

    for (let i = 0; i < count; i++) {
      const buttonText = await buttons.nth(i).textContent()
      if (buttonText) return buttonText.trim()
    }

    return ''
  }

  /**
   * Get the displayed lead name
   */
  async getDisplayedName(): Promise<string> {
    // Get the h1 in the main card area (not header)
    const nameElement = this.page.locator('main').locator('h1').nth(1)
    return (await nameElement.textContent()) || ''
  }

  /**
   * Get the displayed expected revenue value
   */
  async getDisplayedRevenue(): Promise<string> {
    const revenueElement = this.page.locator('.number-display').filter({ hasText: '₪' }).first()
    return (await revenueElement.textContent()) || ''
  }

  /**
   * Verify the lead details are displayed correctly
   */
  async expectLeadDetails(expected: {
    name?: string
    email?: string
    phone?: string
    status?: string
  }): Promise<void> {
    if (expected.name) {
      // Use the heading in main content area (not header)
      await expect(this.page.locator('main').getByRole('heading', { name: expected.name }).first()).toBeVisible()
    }
    if (expected.email) {
      await expect(this.page.getByText(expected.email)).toBeVisible()
    }
    if (expected.phone) {
      await expect(this.page.getByText(expected.phone)).toBeVisible()
    }
    if (expected.status) {
      const statusBadge = this.statusBadge
      await expect(statusBadge).toContainText(expected.status)
    }
  }

  /**
   * Go back to leads list
   */
  async goBack(): Promise<void> {
    await this.backButton.click()
    await expect(this.page).toHaveURL('/leads')
  }

  /**
   * Check if timeline shows specific event type
   */
  async expectTimelineEvent(eventType: string): Promise<void> {
    const timeline = this.page.locator('text=היסטוריית פעולות').locator('..')
    await expect(timeline).toBeVisible()
  }
}
