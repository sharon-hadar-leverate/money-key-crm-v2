import { test, expect } from '@playwright/test'
import { LeadsPage } from '../pages/leads-page'
import { LeadDetailPage } from '../pages/lead-detail-page'
import { seedTestLead, deleteTestLead, getLeadFromDB, getLeadEventsFromDB } from '../fixtures/test-data'

test.describe('Lead Status Transitions', () => {
  let testLeadId: string

  test.beforeEach(async () => {
    // Seed a test lead with 'new' status
    const lead = await seedTestLead({
      name: 'Test Status Lead',
      email: 'status@test.com',
      phone: '0509876543',
      expected_revenue: 20000,
      status: 'new',
    })
    testLeadId = lead.id!
  })

  test.afterEach(async () => {
    if (testLeadId) {
      await deleteTestLead(testLeadId)
    }
  })

  /**
   * Test Case 2.1: Full Status Lifecycle
   *
   * Verifies:
   * - Lead starts with 'new' status
   * - Transition to 'contacted' status works
   * - Transition to 'customer' status works
   * - Status changes persist in database
   * - Audit trail (lead_events) is created
   */
  test('full status lifecycle: new -> contacted -> customer', async ({ page }) => {
    const detailPage = new LeadDetailPage(page)

    // Navigate to test lead
    await detailPage.goto(testLeadId)

    // Verify initial status is 'new' (חדש)
    const initialStatus = await detailPage.getCurrentStatus()
    expect(initialStatus).toContain('חדש')

    // Transition to 'contacted'
    await detailPage.clickStatusButton('contacted')

    // Verify in database (server action updates DB directly)
    let dbLead = await getLeadFromDB(testLeadId)
    expect(dbLead?.status).toBe('contacted')

    // Reload page to see the updated button state
    await page.reload()
    await detailPage.waitForPageLoad()

    // Verify the contacted button is now disabled (current status)
    await expect(page.getByRole('button', { name: 'נוצר קשר' })).toBeDisabled()

    // Transition to 'customer'
    await detailPage.clickStatusButton('customer')

    // Verify in database
    dbLead = await getLeadFromDB(testLeadId)
    expect(dbLead?.status).toBe('customer')

    // Reload page to verify button state
    await page.reload()
    await detailPage.waitForPageLoad()
    await expect(page.getByRole('button', { name: 'לקוח' })).toBeDisabled()

    // Verify events were created (audit trail)
    const events = await getLeadEventsFromDB(testLeadId)
    const statusEvents = events.filter(e => e.event_type === 'status_changed')
    expect(statusEvents.length).toBeGreaterThanOrEqual(2)
  })

  /**
   * Test Case 2.2: Status Change via Table Dropdown Menu
   *
   * Verifies:
   * - Status can be changed from the leads table dropdown
   * - Status updates are reflected in table view
   */
  test('change status via table dropdown menu', async ({ page }) => {
    const leadsPage = new LeadsPage(page)

    // Navigate to leads page
    await leadsPage.goto()
    await leadsPage.waitForLeadsLoaded()

    // Search for test lead
    await leadsPage.searchLead('Test Status Lead')
    await expect(leadsPage.getLeadRow('Test Status Lead')).toBeVisible()

    // Change status via dropdown
    await leadsPage.changeLeadStatusViaMenu('Test Status Lead', 'contacted')

    // Wait for toast confirmation
    await leadsPage.expectSuccessToast('הסטטוס עודכן בהצלחה')

    // Verify status in database
    const dbLead = await getLeadFromDB(testLeadId)
    expect(dbLead?.status).toBe('contacted')

    // Refresh page and verify status persists
    await page.reload()
    await leadsPage.waitForLeadsLoaded()
    await leadsPage.searchLead('Test Status Lead')

    // The row should still show 'contacted' status after refresh
    const row = leadsPage.getLeadRow('Test Status Lead')
    await expect(row.getByText('נוצר קשר')).toBeVisible()
  })

  /**
   * Test Case 2.3: Status Change Persists Across Navigation
   *
   * Verifies:
   * - Status change on detail page reflects in table view
   * - Navigating back and forth maintains correct status
   */
  test('status change persists across navigation', async ({ page }) => {
    const leadsPage = new LeadsPage(page)
    const detailPage = new LeadDetailPage(page)

    // Start on detail page
    await detailPage.goto(testLeadId)

    // Change status to 'contacted'
    await detailPage.clickStatusButton('contacted')

    // Go back to leads table
    await detailPage.goBack()
    await leadsPage.waitForLeadsLoaded()

    // Search for our lead
    await leadsPage.searchLead('Test Status Lead')

    // Verify status shows 'נוצר קשר' in table (look for status badge in row)
    const row = leadsPage.getLeadRow('Test Status Lead')
    await expect(row).toBeVisible()
    // The status badge should contain the contacted status text
    await expect(row.locator('[class*="rounded"]').filter({ hasText: 'נוצר קשר' })).toBeVisible()

    // Click back into detail
    await row.locator('a').first().click()
    await detailPage.waitForPageLoad()

    // Verify status is still 'contacted' (button should be disabled)
    await expect(page.getByRole('button', { name: 'נוצר קשר' })).toBeDisabled()
  })

  /**
   * Test Case 2.4: Status Button is Disabled for Current Status
   *
   * Verifies:
   * - The button for the current status appears selected/disabled
   * - Other status buttons remain clickable
   */
  test('current status button is visually selected', async ({ page }) => {
    const detailPage = new LeadDetailPage(page)

    await detailPage.goto(testLeadId)

    // The 'new' (חדש) button should appear selected
    const newButton = page.getByRole('button', { name: 'חדש' })
    await expect(newButton).toBeDisabled()

    // Other buttons should be enabled
    const contactedButton = page.getByRole('button', { name: 'נוצר קשר' })
    await expect(contactedButton).toBeEnabled()
  })
})
