import type { LeadStatus } from '@/types/leads'

/**
 * Hidden/Deprecated Statuses
 *
 * These statuses exist in the database but should not be shown as options
 * for new selections (quick actions, dropdowns, etc.)
 * They can still be displayed if a lead already has this status.
 */
export const HIDDEN_STATUSES: LeadStatus[] = [
  'new',              // חדש
  'not_contacted',    // טרם יצרנו קשר
  'contacted',        // נוצר קשר
  'pending_agreement', // בהמתנה להסכם
  'customer',         // לקוח
  'lost',             // אבוד
  'future_interest',  // מעוניין בעתיד
]

/**
 * Check if a status is hidden/deprecated
 */
export function isHiddenStatus(status: LeadStatus): boolean {
  return HIDDEN_STATUSES.includes(status)
}

/**
 * Status Flow Configuration
 *
 * Edit this file to change which statuses appear as "quick actions"
 * for each status in the lead detail page.
 */
export const STATUS_FLOW: Record<LeadStatus, LeadStatus[]> = {
  // === INITIAL CONTACT ===
  'new': ['contacted', 'no_answer', 'not_relevant'],
  'before_contact': ['contacted', 'no_answer', 'not_relevant'],
  'not_contacted': ['contacted', 'no_answer', 'not_relevant'],

  // === FOLLOW UP ===
  'no_answer': ['contacted', 'message_sent', 'not_relevant', 'future_interest'],
  'contacted': ['meeting_set', 'message_sent', 'pending_agreement', 'not_relevant'],
  'message_sent': ['contacted', 'meeting_set', 'no_answer', 'future_interest'],

  // === ADVANCING ===
  'meeting_set': ['pending_agreement', 'agreement_sent', 'not_relevant', 'closed_elsewhere'],
  'pending_agreement': ['agreement_sent', 'signed', 'not_relevant'],
  'agreement_sent': ['signed', 'customer', 'pending_agreement', 'closed_elsewhere'],

  // === ACTIVE CUSTOMERS ===
  'signed': ['customer', 'under_review', 'missing_document'],
  'customer': ['under_review', 'report_submitted', 'missing_document', 'completed'],
  'under_review': ['report_submitted', 'missing_document', 'completed'],
  'report_submitted': ['completed', 'missing_document'],
  'missing_document': ['under_review', 'report_submitted', 'completed'],
  'completed': ['customer'],

  // === LOST/FUTURE ===
  'lost': ['new', 'contacted', 'future_interest'],
  'not_relevant': ['new', 'future_interest'],
  'closed_elsewhere': ['new', 'future_interest'],
  'future_interest': ['contacted', 'new'],
  'relevant_next_year': ['contacted', 'new', 'future_interest'],
}

/**
 * Get quick actions for a status (filters out hidden statuses)
 */
export function getQuickActions(currentStatus: LeadStatus | null): LeadStatus[] {
  const status = currentStatus || 'new'
  const actions = STATUS_FLOW[status] || []
  return actions.filter(s => !HIDDEN_STATUSES.includes(s))
}

/**
 * Get all visible statuses (filters out hidden ones)
 */
export function getVisibleStatuses(statuses: readonly LeadStatus[]): LeadStatus[] {
  return [...statuses].filter(s => !HIDDEN_STATUSES.includes(s))
}
