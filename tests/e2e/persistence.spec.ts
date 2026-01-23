import { test, expect, BrowserContext } from '@playwright/test'
import { LeadsPage } from '../pages/leads-page'
import { LeadDetailPage } from '../pages/lead-detail-page'
import { seedTestLead, deleteTestLead, getLeadFromDB } from '../fixtures/test-data'

test.describe('Data Persistence Across Sessions', () => {
  let testLeadId: string

  test.beforeEach(async () => {
    // Create a test lead with specific data for persistence verification
    const lead = await seedTestLead({
      name: 'Persistence Test Lead',
      email: 'persistence@test.com',
      phone: '0525555555',
      expected_revenue: 100000,
      probability: 75,
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
   * Test Case 4.1: Cross-Session Data Integrity
   *
   * Verifies:
   * - Lead data persists after browser close
   * - Data matches what was stored in database
   * - All fields are correctly retrieved
   */
  test('lead data persists across browser sessions', async ({ browser }) => {
    // Create first browser context (session)
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    const detailPage1 = new LeadDetailPage(page1)

    // Navigate to lead and verify data
    await detailPage1.goto(testLeadId)
    await detailPage1.expectLeadDetails({
      name: 'Persistence Test Lead',
      email: 'persistence@test.com',
      phone: '0525555555',
    })

    // Modify the lead
    await detailPage1.enterEditMode()
    await detailPage1.updateName('Modified Persistence Lead')
    await detailPage1.updateExpectedRevenue('150000')
    await detailPage1.saveChanges()

    // Close the first browser context entirely
    await context1.close()

    // Create a completely new browser context (simulating new session)
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()
    const detailPage2 = new LeadDetailPage(page2)

    // Navigate to the same lead in new session
    await detailPage2.goto(testLeadId)

    // Verify the modified data persisted (in main content heading)
    await expect(page2.locator('main').getByRole('heading', { name: 'Modified Persistence Lead' }).first()).toBeVisible()

    // Verify directly in database as well
    const dbLead = await getLeadFromDB(testLeadId)
    expect(dbLead).not.toBeNull()
    expect(dbLead?.name).toBe('Modified Persistence Lead')
    expect(dbLead?.expected_revenue).toBe(150000)
    expect(dbLead?.email).toBe('persistence@test.com')
    expect(dbLead?.phone).toBe('0525555555')

    await context2.close()
  })

  /**
   * Test Case 4.2: Data Visible in Multiple Tabs Simultaneously
   *
   * Verifies:
   * - Same data is visible when opening lead in multiple tabs
   * - Changes in one tab reflect in another after refresh
   */
  test('data consistency across multiple tabs', async ({ context }) => {
    // Open lead in first tab
    const tab1 = await context.newPage()
    const detailPage1 = new LeadDetailPage(tab1)
    await detailPage1.goto(testLeadId)

    // Open same lead in second tab
    const tab2 = await context.newPage()
    const detailPage2 = new LeadDetailPage(tab2)
    await detailPage2.goto(testLeadId)

    // Verify both tabs show the same data (in main content heading)
    await expect(tab1.locator('main').getByRole('heading', { name: 'Persistence Test Lead' }).first()).toBeVisible()
    await expect(tab2.locator('main').getByRole('heading', { name: 'Persistence Test Lead' }).first()).toBeVisible()

    // Modify data in tab1
    await detailPage1.enterEditMode()
    await detailPage1.updateName('Updated from Tab 1')
    await detailPage1.saveChanges()

    // Refresh tab2 and verify it shows updated data
    await tab2.reload()
    await detailPage2.waitForPageLoad()

    await expect(tab2.locator('main').getByRole('heading', { name: 'Updated from Tab 1' }).first()).toBeVisible()

    await tab1.close()
    await tab2.close()
  })

  /**
   * Test Case 4.3: Lead Appears in Table After Creation
   *
   * Verifies:
   * - Newly created lead appears in leads table
   * - Data in table matches what was created
   */
  test('new lead appears in leads table', async ({ page }) => {
    const leadsPage = new LeadsPage(page)

    // Navigate to leads page
    await leadsPage.goto()
    await leadsPage.waitForLeadsLoaded()

    // Search for our test lead
    await leadsPage.searchLead('Persistence Test Lead')

    // Verify lead is in the table
    await expect(leadsPage.getLeadRow('Persistence Test Lead')).toBeVisible()

    // Verify it shows 'new' status (חדש)
    const row = leadsPage.getLeadRow('Persistence Test Lead')
    await expect(row.getByText('חדש')).toBeVisible()
  })

  /**
   * Test Case 4.4: Database State Matches UI State
   *
   * Verifies:
   * - All displayed values match database records
   * - No data corruption between layers
   */
  test('UI state matches database state', async ({ page }) => {
    const detailPage = new LeadDetailPage(page)

    // Get data directly from database
    const dbLead = await getLeadFromDB(testLeadId)
    expect(dbLead).not.toBeNull()

    // Navigate to lead detail page
    await detailPage.goto(testLeadId)

    // Verify each field matches database (use main content heading)
    await expect(page.locator('main').getByRole('heading', { name: dbLead!.name }).first()).toBeVisible()

    if (dbLead!.email) {
      await expect(page.getByText(dbLead!.email)).toBeVisible()
    }

    if (dbLead!.phone) {
      await expect(page.getByText(dbLead!.phone)).toBeVisible()
    }

    // Verify status matches
    const statusMap = {
      new: 'חדש',
      contacted: 'נוצר קשר',
      customer: 'לקוח',
      lost: 'אבוד',
    }
    const expectedStatus = statusMap[dbLead!.status as keyof typeof statusMap]
    await expect(page.getByText(expectedStatus)).toBeVisible()
  })
})

test.describe('Edge Cases - Persistence', () => {
  /**
   * Test Case 4.5: Handling Non-Existent Lead
   *
   * Verifies:
   * - Navigating to non-existent lead shows 404
   * - App handles gracefully
   */
  test('navigating to non-existent lead shows 404', async ({ page }) => {
    // Try to navigate to a UUID that doesn't exist
    const fakeId = '00000000-0000-0000-0000-000000000000'

    await page.goto(`/leads/${fakeId}`)

    // Should show 404 or not found message
    await expect(page.getByText('404').or(page.getByText('לא נמצא'))).toBeVisible()
  })
})
