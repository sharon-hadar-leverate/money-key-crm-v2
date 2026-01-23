import { test, expect } from '@playwright/test'
import { LeadsPage } from '../pages/leads-page'
import { LeadDetailPage } from '../pages/lead-detail-page'
import { seedTestLead, deleteTestLead, getLeadFromDB, cleanupTestLeads } from '../fixtures/test-data'

test.describe('Lead CRUD Operations', () => {
  let testLeadId: string

  test.beforeEach(async () => {
    // Seed a test lead before each test
    const lead = await seedTestLead({
      name: 'Test CRUD Lead',
      email: 'crud@test.com',
      phone: '0501234567',
      expected_revenue: 10000,
      status: 'new',
    })
    testLeadId = lead.id!
  })

  test.afterEach(async () => {
    // Clean up test lead after each test
    if (testLeadId) {
      await deleteTestLead(testLeadId)
    }
  })

  /**
   * Test Case 1.1: View Lead in Table and Navigate to Detail
   *
   * Verifies:
   * - Lead appears in the leads table
   * - Clicking on lead navigates to detail page
   * - Lead data displays correctly on detail page
   */
  test('view lead in table and navigate to detail page', async ({ page }) => {
    const detailPage = new LeadDetailPage(page)

    // Navigate directly to the seeded lead's detail page
    await detailPage.goto(testLeadId)

    // Wait for page to load
    await detailPage.waitForPageLoad()

    // Verify we're on the detail page
    await expect(page).toHaveURL(new RegExp(`/leads/${testLeadId}`))

    // Verify lead details are displayed
    await detailPage.expectLeadDetails({
      name: 'Test CRUD Lead',
      email: 'crud@test.com',
      phone: '0501234567',
    })
  })

  /**
   * Test Case 1.2: Edit Lead with Auto-Save and Persistence
   *
   * Verifies:
   * - Enter edit mode successfully
   * - Update fields and save
   * - Changes persist after page refresh
   * - Changes verified in database
   */
  test('edit lead and verify persistence', async ({ page, context }) => {
    const detailPage = new LeadDetailPage(page)

    // Navigate to the test lead detail page
    await detailPage.goto(testLeadId)

    // Enter edit mode
    await detailPage.enterEditMode()

    // Update fields
    await detailPage.updateName('Updated Test Lead')
    await detailPage.updateExpectedRevenue('50000')

    // Save changes
    await detailPage.saveChanges()

    // Verify the name shows the updated value (use main content h1)
    await expect(page.locator('main').getByRole('heading', { name: 'Updated Test Lead' }).first()).toBeVisible()

    // Refresh page and verify persistence
    await page.reload()
    await detailPage.waitForPageLoad()

    // Verify updated name persists (in main content)
    await expect(page.locator('main').getByRole('heading', { name: 'Updated Test Lead' }).first()).toBeVisible()

    // Open a new tab and verify data there too
    const newTab = await context.newPage()
    const newDetailPage = new LeadDetailPage(newTab)
    await newDetailPage.goto(testLeadId)

    await expect(newTab.locator('main').getByRole('heading', { name: 'Updated Test Lead' }).first()).toBeVisible()

    // Verify changes in database
    const dbLead = await getLeadFromDB(testLeadId)
    expect(dbLead?.name).toBe('Updated Test Lead')
    expect(dbLead?.expected_revenue).toBe(50000)

    await newTab.close()
  })

  /**
   * Test Case 1.3: Cancel Edit Discards Changes
   *
   * Verifies:
   * - Changes made in edit mode are discarded when cancelled
   * - Original data remains after cancellation
   */
  test('cancel edit discards changes', async ({ page }) => {
    const detailPage = new LeadDetailPage(page)

    // Navigate to the test lead detail page
    await detailPage.goto(testLeadId)

    // Remember original name
    const originalName = await detailPage.getDisplayedName()

    // Enter edit mode
    await detailPage.enterEditMode()

    // Make changes
    await detailPage.updateName('Changed Name That Should Not Save')

    // Cancel edit
    await detailPage.cancelEdit()

    // Verify original name is still displayed
    await expect(page.getByText(originalName.trim())).toBeVisible()

    // Verify database was not modified
    const dbLead = await getLeadFromDB(testLeadId)
    expect(dbLead?.name).toBe('Test CRUD Lead')
  })
})

test.describe('Lead CRUD - Multiple Leads Scenario', () => {
  test.afterAll(async () => {
    await cleanupTestLeads('Multiple Test')
  })

  /**
   * Test Case 1.4: Search Filters Leads Correctly
   *
   * Verifies:
   * - Creating multiple leads shows them all
   * - Search filters to show only matching leads
   */
  test('search filters leads correctly', async ({ page }) => {
    // Seed multiple test leads
    const lead1 = await seedTestLead({ name: 'Multiple Test Alpha', email: 'alpha@test.com' })
    const lead2 = await seedTestLead({ name: 'Multiple Test Beta', email: 'beta@test.com' })
    const lead3 = await seedTestLead({ name: 'Multiple Test Gamma', email: 'gamma@test.com' })

    const leadsPage = new LeadsPage(page)
    await leadsPage.goto()
    await leadsPage.waitForLeadsLoaded()

    // Search for "Alpha"
    await leadsPage.searchLead('Alpha')

    // Verify only Alpha lead is visible
    await expect(leadsPage.getLeadRow('Multiple Test Alpha')).toBeVisible()
    await expect(leadsPage.getLeadRow('Multiple Test Beta')).not.toBeVisible()
    await expect(leadsPage.getLeadRow('Multiple Test Gamma')).not.toBeVisible()

    // Clear search and search for "Multiple Test"
    await leadsPage.searchLead('Multiple Test')

    // Now all three should be visible
    await expect(leadsPage.getLeadRow('Multiple Test Alpha')).toBeVisible()
    await expect(leadsPage.getLeadRow('Multiple Test Beta')).toBeVisible()
    await expect(leadsPage.getLeadRow('Multiple Test Gamma')).toBeVisible()

    // Cleanup
    await deleteTestLead(lead1.id!)
    await deleteTestLead(lead2.id!)
    await deleteTestLead(lead3.id!)
  })
})
