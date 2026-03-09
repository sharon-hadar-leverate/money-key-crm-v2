import type { LeadStatus } from '@/types/leads'

/**
 * Hidden Statuses
 *
 * These statuses should not be shown as options for new selections
 * (quick actions, dropdowns, etc.) but can still be displayed
 * if a lead already has this status.
 */
export const HIDDEN_STATUSES: LeadStatus[] = [
  'not_contacted',    // טרם יצרנו קשר - initial state, don't offer as action
  'pending_agreement', // נשלח הסכם התקשרות - intermediate
  'constant_no_answer', // אין מענה קבוע - set by automation only
]

/**
 * Check if a status is hidden
 */
export function isHiddenStatus(status: LeadStatus): boolean {
  return HIDDEN_STATUSES.includes(status)
}

/**
 * Status Flow Configuration
 *
 * Edit this file to change which statuses appear as "quick actions"
 * for each status in the lead detail page.
 *
 * Canonical 14 statuses (removed: contacted, completed, paying_customer)
 */
export const STATUS_FLOW: Record<LeadStatus, LeadStatus[]> = {
  // === FOLLOW-UP ===
  'not_contacted': ['message_sent', 'no_answer', 'not_relevant'],
  'no_answer': ['message_sent', 'not_relevant', 'future_interest', 'constant_no_answer'],

  // === WARM ===
  'message_sent': ['meeting_set', 'no_answer', 'future_interest'],
  'meeting_set': ['pending_agreement', 'signed', 'not_relevant', 'closed_elsewhere'],
  'pending_agreement': ['signed', 'not_relevant', 'closed_elsewhere'],

  // === SIGNED (active customers) ===
  'signed': ['under_review', 'report_submitted', 'missing_document', 'waiting_for_payment', 'no_refund'],
  'under_review': ['report_submitted', 'missing_document', 'waiting_for_payment', 'no_refund'],
  'report_submitted': ['waiting_for_payment', 'missing_document', 'no_refund'],
  'missing_document': ['under_review', 'report_submitted', 'waiting_for_payment', 'no_refund'],
  'waiting_for_payment': ['payment_completed', 'not_relevant', 'no_refund'],
  'payment_completed': [], // Terminal state - collection complete

  // === EXIT (יציאה ממשפך) ===
  'not_relevant': ['not_contacted', 'future_interest'],
  'closed_elsewhere': ['not_contacted', 'future_interest'],
  'no_refund': ['not_contacted', 'future_interest'],

  // === CONSTANT NO ANSWER (terminal exit) ===
  'constant_no_answer': [],

  // === FUTURE ===
  'future_interest': ['message_sent', 'not_contacted'],
}

/**
 * Get quick actions for a status (filters out hidden statuses)
 */
export function getQuickActions(currentStatus: LeadStatus | null): LeadStatus[] {
  const status = currentStatus || 'not_contacted'
  const actions = STATUS_FLOW[status] || []
  return actions.filter(s => !HIDDEN_STATUSES.includes(s))
}

/**
 * Get all visible statuses (filters out hidden ones)
 */
export function getVisibleStatuses(statuses: readonly LeadStatus[]): LeadStatus[] {
  return [...statuses].filter(s => !HIDDEN_STATUSES.includes(s))
}
