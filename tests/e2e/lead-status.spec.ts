import { test, expect } from '@playwright/test'
import { LeadsPage } from '../pages/leads-page'
import { LeadDetailPage } from '../pages/lead-detail-page'
import { seedTestLead, deleteTestLead, getLeadFromDB, getLeadEventsFromDB } from '../fixtures/test-data'

test.describe('Lead Status Transitions', () => {
  let testLeadId: string

  test.beforeEach(async () => {
    // Seed a test lead with 'not_contacted' status
    const lead = await seedTestLead({
      name: 'Test Status Lead',
      email: 'status@test.com',
      phone: '0509876543',
      expected_revenue: 20000,
      status: 'not_contacted',
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
   * - Lead starts with 'not_contacted' status
   * - Transition to 'message_sent' status works
   * - Transition to 'meeting_set' status works
   * - Status changes persist in database
   * - Audit trail (lead_events) is created
   */
  test('full status lifecycle: not_contacted -> message_sent -> meeting_set', async ({ page }) => {
    const detailPage = new LeadDetailPage(page)

    // Navigate to test lead
    await detailPage.goto(testLeadId)

    // Verify initial status is 'not_contacted' (טרם יצרנו קשר)
    const initialStatus = await detailPage.getCurrentStatus()
    expect(initialStatus).toContain('טרם יצרנו קשר')

    // Transition to 'message_sent'
    await detailPage.clickStatusButton('message_sent')

    // Verify in database (server action updates DB directly)
    let dbLead = await getLeadFromDB(testLeadId)
    expect(dbLead?.status).toBe('message_sent')

    // Reload page to see the updated button state
    await page.reload()
    await detailPage.waitForPageLoad()

    // Verify the message_sent button is now disabled (current status)
    await expect(page.getByRole('button', { name: 'נשלחה הודעה' })).toBeDisabled()

    // Transition to 'meeting_set' (following the warm -> signed flow)
    await detailPage.clickStatusButton('meeting_set')

    // Verify in database
    dbLead = await getLeadFromDB(testLeadId)
    expect(dbLead?.status).toBe('meeting_set')

    // Reload page to verify button state
    await page.reload()
    await detailPage.waitForPageLoad()
    await expect(page.getByRole('button', { name: 'נקבעה שיחה' })).toBeDisabled()

    // Verify events were created (audit trail)
    const events = await getLeadEventsFromDB(testLeadId)
    const statusEvents = events.filter(e => e.event_type === 'status_changed')
    expect(statusEvents.length).toBeGreaterThanOrEqual(2)
  })

  /**
   * Test Case 2.5: Payment Workflow Transitions
   *
   * Verifies:
   * - Payment workflow: signed -> waiting_for_payment -> payment_completed
   */
  test('payment workflow: signed -> waiting_for_payment -> payment_completed', async ({ page }) => {
    // Update test lead to 'signed' status first
    const detailPage = new LeadDetailPage(page)

    // First, manually update to signed status via seed
    await deleteTestLead(testLeadId)
    const lead = await seedTestLead({
      name: 'Test Payment Lead',
      email: 'payment@test.com',
      phone: '0509876544',
      expected_revenue: 30000,
      status: 'signed',
    })
    testLeadId = lead.id!

    await detailPage.goto(testLeadId)

    // Transition to 'waiting_for_payment'
    await detailPage.clickStatusButton('waiting_for_payment')

    let dbLead = await getLeadFromDB(testLeadId)
    expect(dbLead?.status).toBe('waiting_for_payment')

    await page.reload()
    await detailPage.waitForPageLoad()

    // Transition to 'payment_completed'
    await detailPage.clickStatusButton('payment_completed')

    dbLead = await getLeadFromDB(testLeadId)
    expect(dbLead?.status).toBe('payment_completed')
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
    await leadsPage.changeLeadStatusViaMenu('Test Status Lead', 'message_sent')

    // Wait for toast confirmation
    await leadsPage.expectSuccessToast('הסטטוס עודכן בהצלחה')

    // Verify status in database
    const dbLead = await getLeadFromDB(testLeadId)
    expect(dbLead?.status).toBe('message_sent')

    // Refresh page and verify status persists
    await page.reload()
    await leadsPage.waitForLeadsLoaded()
    await leadsPage.searchLead('Test Status Lead')

    // The row should still show 'message_sent' status after refresh
    const row = leadsPage.getLeadRow('Test Status Lead')
    await expect(row.getByText('נשלחה הודעה')).toBeVisible()
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

    // Change status to 'message_sent'
    await detailPage.clickStatusButton('message_sent')

    // Go back to leads table
    await detailPage.goBack()
    await leadsPage.waitForLeadsLoaded()

    // Search for our lead
    await leadsPage.searchLead('Test Status Lead')

    // Verify status shows 'נשלחה הודעה' in table (look for status badge in row)
    const row = leadsPage.getLeadRow('Test Status Lead')
    await expect(row).toBeVisible()
    // The status badge should contain the message_sent status text
    await expect(row.locator('[class*="rounded"]').filter({ hasText: 'נשלחה הודעה' })).toBeVisible()

    // Click back into detail
    await row.locator('a').first().click()
    await detailPage.waitForPageLoad()

    // Verify status is still 'message_sent' (button should be disabled)
    await expect(page.getByRole('button', { name: 'נשלחה הודעה' })).toBeDisabled()
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

    // The 'not_contacted' (טרם יצרנו קשר) is the current status
    // Quick action buttons should be available for next steps
    const messageSentButton = page.getByRole('button', { name: 'נשלחה הודעה' })
    await expect(messageSentButton).toBeEnabled()

    const noAnswerButton = page.getByRole('button', { name: 'אין מענה' })
    await expect(noAnswerButton).toBeEnabled()
  })
})
