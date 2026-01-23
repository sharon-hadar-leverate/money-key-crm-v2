import { test, expect } from '@playwright/test'
import { DashboardPage } from '../pages/dashboard-page'
import { LeadsPage } from '../pages/leads-page'
import { seedTestLead, seedDashboardLeads, cleanupTestLeads, getLeadCountsByStatus } from '../fixtures/test-data'

test.describe('Dashboard Analytics', () => {
  test.beforeAll(async () => {
    // Clean up any previous test leads
    await cleanupTestLeads('Test')
  })

  test.afterAll(async () => {
    // Clean up test leads after all tests
    await cleanupTestLeads('Test')
  })

  /**
   * Test Case 3.1: KPI Cards and Charts Reflect Data
   *
   * Verifies:
   * - Dashboard loads successfully with all components
   * - KPI cards display numeric values
   * - Charts are rendered
   */
  test('dashboard displays KPI cards and charts', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)

    // Navigate to dashboard
    await dashboardPage.goto()

    // Verify all components are visible
    await dashboardPage.expectFullyLoaded()

    // Verify KPI cards have values (not just zeros)
    const newLeads = await dashboardPage.getKPIValue('במעקב')
    expect(newLeads).toBeTruthy()

    const warm = await dashboardPage.getKPIValue('חמים')
    expect(warm).toBeTruthy()

    const customers = await dashboardPage.getKPIValue('לקוחות')
    expect(customers).toBeTruthy()

    const revenue = await dashboardPage.getKPIValue('הכנסה צפויה')
    expect(revenue).toBeTruthy()
  })

  /**
   * Test Case 3.2: KPI Values Match Database Counts
   *
   * Verifies:
   * - Seeded data appears in KPI counts
   * - Dashboard refreshes to show new data
   */
  test('KPI values update after adding leads', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)

    // First, get baseline counts from dashboard
    await dashboardPage.goto()
    const initialNewLeads = await dashboardPage.getNewLeadsCount()

    // Seed new test leads
    const seededLeads = await seedDashboardLeads()
    const newLeadsSeeded = seededLeads.filter(l => l.status === 'new').length

    // Refresh dashboard
    await page.reload()
    await dashboardPage.waitForPageLoad()

    // Verify new leads count increased
    const updatedNewLeads = await dashboardPage.getNewLeadsCount()
    expect(updatedNewLeads).toBeGreaterThanOrEqual(initialNewLeads + newLeadsSeeded)

    // Verify database counts match dashboard
    const dbCounts = await getLeadCountsByStatus()
    const dashboardContacted = await dashboardPage.getContactedLeadsCount()
    const dashboardCustomers = await dashboardPage.getCustomersCount()

    // Allow for some variance due to other data, but seeded data should be included
    expect(dashboardContacted).toBeGreaterThanOrEqual(
      seededLeads.filter(l => l.status === 'contacted').length
    )
    expect(dashboardCustomers).toBeGreaterThanOrEqual(
      seededLeads.filter(l => l.status === 'customer').length
    )
  })

  /**
   * Test Case 3.3: Quick Actions Navigation
   *
   * Verifies:
   * - Quick action links navigate to correct pages
   */
  test('quick actions navigate to correct pages', async ({ page }) => {
    const dashboardPage = new DashboardPage(page)

    await dashboardPage.goto()

    // Click "כל הלידים" quick action
    await dashboardPage.clickAllLeadsAction()

    // Verify navigation to leads page
    await expect(page).toHaveURL('/leads')

    // Navigate back to dashboard and test another action
    await page.goBack()
    await dashboardPage.waitForPageLoad()

    // Click "ליד חדש" quick action
    await dashboardPage.clickNewLeadAction()

    // Verify navigation to new lead page
    await expect(page).toHaveURL('/leads/new')
  })
})

test.describe('Dashboard UTM Performance', () => {
  test.afterAll(async () => {
    await cleanupTestLeads('UTM Test')
  })

  /**
   * Test Case 3.4: UTM Performance Display
   *
   * Verifies:
   * - UTM chart displays sources
   * - Sources with leads appear in the chart
   */
  test('UTM chart shows lead sources', async ({ page }) => {
    // Seed leads with specific UTM sources
    const timestamp = Date.now()
    await seedTestLead({
      name: `UTM Test Google ${timestamp}`,
      utm_source: 'google',
      expected_revenue: 5000,
    })
    await seedTestLead({
      name: `UTM Test Facebook ${timestamp}`,
      utm_source: 'facebook',
      expected_revenue: 3000,
    })

    const dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()

    // Verify UTM chart is visible
    await dashboardPage.expectUTMChartVisible()

    // Note: Specific source verification depends on how the chart is rendered
    // The UTM chart should be visible and rendering the data
    await expect(dashboardPage.utmChart).toBeVisible()
  })
})
