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
  'contacted',        // נוצר קשר - intermediate, prefer more specific
  'pending_agreement', // בהמתנה להסכם - intermediate
  'future_interest',  // מעוניין בעתיד - rarely selected manually
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
 * Canonical 14 statuses
 */
export const STATUS_FLOW: Record<LeadStatus, LeadStatus[]> = {
  // === FOLLOW-UP ===
  'not_contacted': ['contacted', 'no_answer', 'not_relevant'],
  'no_answer': ['contacted', 'message_sent', 'not_relevant', 'future_interest'],

  // === WARM ===
  'contacted': ['meeting_set', 'message_sent', 'pending_agreement', 'not_relevant'],
  'message_sent': ['contacted', 'meeting_set', 'no_answer', 'future_interest'],

  // === HOT ===
  'meeting_set': ['pending_agreement', 'signed', 'not_relevant', 'closed_elsewhere'],
  'pending_agreement': ['signed', 'not_relevant', 'closed_elsewhere'],

  // === SIGNED (active customers) ===
  'signed': ['under_review', 'report_submitted', 'missing_document', 'completed'],
  'under_review': ['report_submitted', 'missing_document', 'completed'],
  'report_submitted': ['completed', 'missing_document'],
  'missing_document': ['under_review', 'report_submitted', 'completed'],
  'completed': ['signed'],

  // === LOST ===
  'not_relevant': ['not_contacted', 'future_interest'],
  'closed_elsewhere': ['not_contacted', 'future_interest'],

  // === FUTURE ===
  'future_interest': ['contacted', 'not_contacted'],
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
