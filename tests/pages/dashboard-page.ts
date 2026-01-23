import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from './base-page'

/**
 * Page object for /dashboard page
 */
export class DashboardPage extends BasePage {
  readonly kpiCards: Locator
  readonly conversionChart: Locator
  readonly utmChart: Locator
  readonly recentActivity: Locator

  constructor(page: Page) {
    super(page)
    // KPI cards are in the main area with specific titles
    this.kpiCards = page.locator('main').locator('div').filter({ has: page.locator('p') })
    this.conversionChart = page.locator('text=לידים לפי סטטוס').locator('..')
    this.utmChart = page.locator('text=לידים לפי מקור').locator('..')
    this.recentActivity = page.locator('text=פעילות אחרונה').locator('..')
  }

  /**
   * Navigate to dashboard page
   */
  async goto(): Promise<void> {
    await this.page.goto('/dashboard')
    await this.waitForPageLoad()
  }

  /**
   * Get a specific KPI card by title
   */
  getKPICard(title: string): Locator {
    // Find the element that contains the KPI title text
    return this.page.locator('main').getByText(title, { exact: true }).first()
  }

  /**
   * Get the value from a KPI card (the number next to the title)
   */
  async getKPIValue(title: string): Promise<string> {
    // The KPI value is typically a sibling or nearby element to the title
    const card = this.page.locator('main').locator(`text=${title}`).locator('..').locator('p').last()
    return (await card.textContent()) || '0'
  }

  /**
   * Get the numeric value from a KPI card (removes formatting)
   */
  async getKPINumericValue(title: string): Promise<number> {
    const valueStr = await this.getKPIValue(title)
    // Remove Hebrew characters, commas, and currency symbols
    const numericStr = valueStr.replace(/[^\d.]/g, '')
    return parseFloat(numericStr) || 0
  }

  /**
   * Get follow_up/new leads count from KPI
   */
  async getNewLeadsCount(): Promise<number> {
    return this.getKPINumericValue('במעקב')
  }

  /**
   * Get warm (contacted) leads count from KPI
   */
  async getContactedLeadsCount(): Promise<number> {
    return this.getKPINumericValue('חמים')
  }

  /**
   * Get customers count from KPI
   */
  async getCustomersCount(): Promise<number> {
    return this.getKPINumericValue('לקוחות')
  }

  /**
   * Get expected revenue from KPI
   */
  async getExpectedRevenue(): Promise<number> {
    return this.getKPINumericValue('הכנסה צפויה')
  }

  /**
   * Click on "ליד חדש" quick action
   */
  async clickNewLeadAction(): Promise<void> {
    await this.page.getByRole('link', { name: 'ליד חדש' }).click()
  }

  /**
   * Click on "כל הלידים" quick action
   */
  async clickAllLeadsAction(): Promise<void> {
    await this.page.getByRole('link', { name: 'כל הלידים' }).click()
  }

  /**
   * Verify all KPI cards are displayed
   */
  async expectKPICardsVisible(): Promise<void> {
    await expect(this.getKPICard('במעקב')).toBeVisible()
    await expect(this.getKPICard('חמים')).toBeVisible()
    await expect(this.getKPICard('לקוחות')).toBeVisible()
    await expect(this.getKPICard('הכנסה צפויה')).toBeVisible()
  }

  /**
   * Verify conversion chart is displayed
   */
  async expectConversionChartVisible(): Promise<void> {
    await expect(this.conversionChart).toBeVisible()
  }

  /**
   * Verify UTM chart is displayed
   */
  async expectUTMChartVisible(): Promise<void> {
    await expect(this.utmChart).toBeVisible()
  }

  /**
   * Verify recent activity section is displayed
   */
  async expectRecentActivityVisible(): Promise<void> {
    await expect(this.recentActivity).toBeVisible()
  }

  /**
   * Verify all dashboard components are loaded
   */
  async expectFullyLoaded(): Promise<void> {
    await this.expectKPICardsVisible()
    await this.expectConversionChartVisible()
    await this.expectUTMChartVisible()
    await this.expectRecentActivityVisible()
  }

  /**
   * Check if UTM chart shows a specific source
   */
  async expectUTMSource(source: string): Promise<void> {
    await expect(this.utmChart.getByText(source)).toBeVisible()
  }
}
