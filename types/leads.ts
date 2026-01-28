import type { Database } from './database'

// Base types from database
export type Lead = Database['public']['Tables']['leads']['Row']
export type LeadInsert = Database['public']['Tables']['leads']['Insert']
export type LeadUpdate = Database['public']['Tables']['leads']['Update']

export type LeadEvent = Database['public']['Tables']['lead_events']['Row']
export type LeadEventInsert = Database['public']['Tables']['lead_events']['Insert']

// Application-level enums and types
// Canonical 14 statuses
export const LEAD_STATUSES = [
  // Follow-up stage
  'not_contacted',    // טרם יצרנו קשר
  'no_answer',        // אין מענה
  // Warm stage
  'contacted',        // נוצר קשר
  'message_sent',     // נשלחה הודעה
  // Hot stage
  'meeting_set',      // נקבעה שיחה
  'pending_agreement', // בהמתנה להסכם
  // Signed stage (active customers)
  'signed',           // חתם על הסכם התקשרות
  'under_review',     // בבדיקה
  'report_submitted', // הוגש דוח
  'missing_document', // חסר מסמך
  'completed',        // הושלם
  // Lost stage
  'not_relevant',     // לא רלוונטי
  'closed_elsewhere', // סגר במקום אחר
  // Future stage
  'future_interest',  // מעוניין בעתיד
] as const
export type LeadStatus = typeof LEAD_STATUSES[number]

// Pipeline stages for grouping statuses
export const PIPELINE_STAGES = {
  follow_up: ['not_contacted', 'no_answer'],
  warm: ['contacted', 'message_sent'],
  hot: ['meeting_set', 'pending_agreement'],
  signed: ['signed', 'under_review', 'report_submitted', 'missing_document', 'completed'],
  lost: ['not_relevant', 'closed_elsewhere'],
  future: ['future_interest'],
} as const
export type PipelineStage = keyof typeof PIPELINE_STAGES

export const EVENT_TYPES = [
  'created',
  'updated',
  'field_changed',
  'status_changed',
  'deleted',
  'restored',
  'note_added',
  'note_updated',
  'note_deleted'
] as const
export type EventType = typeof EVENT_TYPES[number]

// Status configuration with Hebrew labels (Monday.com Light Theme)
export const STATUS_CONFIG: Record<LeadStatus, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  cssClass: string
  pipelineStage: PipelineStage
}> = {
  // === Follow-up statuses ===
  not_contacted: {
    label: 'טרם יצרנו קשר',
    color: 'text-[#0073EA]',
    bgColor: 'bg-[#CCE5FF]',
    borderColor: 'border-transparent',
    cssClass: 'status-not-contacted',
    pipelineStage: 'follow_up'
  },
  no_answer: {
    label: 'אין מענה',
    color: 'text-[#676879]',
    bgColor: 'bg-[#F5F6F8]',
    borderColor: 'border-[#E6E9EF]',
    cssClass: 'status-no-answer',
    pipelineStage: 'follow_up'
  },
  // === Warm statuses ===
  contacted: {
    label: 'נוצר קשר',
    color: 'text-[#D17A00]',
    bgColor: 'bg-[#FFF0D6]',
    borderColor: 'border-transparent',
    cssClass: 'status-contacted',
    pipelineStage: 'warm'
  },
  message_sent: {
    label: 'נשלחה הודעה',
    color: 'text-[#D17A00]',
    bgColor: 'bg-[#FFF0D6]',
    borderColor: 'border-transparent',
    cssClass: 'status-message-sent',
    pipelineStage: 'warm'
  },
  // === Hot statuses ===
  meeting_set: {
    label: 'נקבעה שיחה',
    color: 'text-[#D93D42]',
    bgColor: 'bg-[#FFEBE6]',
    borderColor: 'border-transparent',
    cssClass: 'status-meeting-set',
    pipelineStage: 'hot'
  },
  pending_agreement: {
    label: 'בהמתנה להסכם',
    color: 'text-[#D17A00]',
    bgColor: 'bg-[#FFF0D6]',
    borderColor: 'border-transparent',
    cssClass: 'status-pending-agreement',
    pipelineStage: 'hot'
  },
  // === Signed statuses (active customers) ===
  signed: {
    label: 'חתם על הסכם התקשרות',
    color: 'text-[#00854D]',
    bgColor: 'bg-[#D4F4DD]',
    borderColor: 'border-transparent',
    cssClass: 'status-signed',
    pipelineStage: 'signed'
  },
  under_review: {
    label: 'בבדיקה',
    color: 'text-[#00854D]',
    bgColor: 'bg-[#D4F4DD]',
    borderColor: 'border-transparent',
    cssClass: 'status-under-review',
    pipelineStage: 'signed'
  },
  report_submitted: {
    label: 'הוגש דוח',
    color: 'text-[#00854D]',
    bgColor: 'bg-[#D4F4DD]',
    borderColor: 'border-transparent',
    cssClass: 'status-report-submitted',
    pipelineStage: 'signed'
  },
  missing_document: {
    label: 'חסר מסמך',
    color: 'text-[#00854D]',
    bgColor: 'bg-[#D4F4DD]',
    borderColor: 'border-transparent',
    cssClass: 'status-missing-document',
    pipelineStage: 'signed'
  },
  completed: {
    label: 'הושלם',
    color: 'text-[#00854D]',
    bgColor: 'bg-[#D4F4DD]',
    borderColor: 'border-[#00854D33]',
    cssClass: 'status-completed',
    pipelineStage: 'signed'
  },
  // === Lost statuses ===
  not_relevant: {
    label: 'לא רלוונטי',
    color: 'text-[#D83A52]',
    bgColor: 'bg-[#FFD6D9]',
    borderColor: 'border-transparent',
    cssClass: 'status-not-relevant',
    pipelineStage: 'lost'
  },
  closed_elsewhere: {
    label: 'סגר במקום אחר',
    color: 'text-[#D83A52]',
    bgColor: 'bg-[#FFD6D9]',
    borderColor: 'border-transparent',
    cssClass: 'status-closed-elsewhere',
    pipelineStage: 'lost'
  },
  // === Future status ===
  future_interest: {
    label: 'מעוניין בעתיד',
    color: 'text-[#00A0B0]',
    bgColor: 'bg-[#D4F4F7]',
    borderColor: 'border-transparent',
    cssClass: 'status-future-interest',
    pipelineStage: 'future'
  },
}

// Event type configuration with Hebrew labels (Monday.com Light Theme)
export const EVENT_CONFIG: Record<EventType, {
  label: string
  icon: string
  color: string
  bgColor: string
}> = {
  created: { label: 'ליד נוצר', icon: 'Plus', color: 'text-[#00854D]', bgColor: 'bg-[#D4F4DD]' },
  updated: { label: 'עודכן', icon: 'Pencil', color: 'text-[#0073EA]', bgColor: 'bg-[#CCE5FF]' },
  field_changed: { label: 'שדה שונה', icon: 'ArrowLeftRight', color: 'text-[#D17A00]', bgColor: 'bg-[#FFF0D6]' },
  status_changed: { label: 'סטטוס שונה', icon: 'RefreshCw', color: 'text-[#9D5BD2]', bgColor: 'bg-[#EDD9FB]' },
  deleted: { label: 'נמחק', icon: 'Trash', color: 'text-[#D83A52]', bgColor: 'bg-[#FFD6D9]' },
  restored: { label: 'שוחזר', icon: 'RotateCcw', color: 'text-[#00A0B0]', bgColor: 'bg-[#D4F4F7]' },
  note_added: { label: 'הערה נוספה', icon: 'MessageSquarePlus', color: 'text-[#E07239]', bgColor: 'bg-[#FDEBDC]' },
  note_updated: { label: 'הערה עודכנה', icon: 'MessageSquare', color: 'text-[#E07239]', bgColor: 'bg-[#FDEBDC]' },
  note_deleted: { label: 'הערה נמחקה', icon: 'MessageSquareX', color: 'text-[#D83A52]', bgColor: 'bg-[#FFD6D9]' }
}

// Custom fields structure (flexible JSON)
export interface CustomFields {
  zoho_id?: string
  zoho_notes?: string
  [key: string]: string | number | boolean | null | undefined
}

// Lead with events for detail views
export interface LeadWithEvents extends Lead {
  lead_events: LeadEvent[]
}

// Form input types (for Server Actions)
export interface CreateLeadInput {
  name: string
  email?: string
  phone?: string
  first_name?: string
  last_name?: string
  source?: string
  expected_revenue?: number
  probability?: number
  custom_fields?: CustomFields
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  gclid?: string
  landing_page?: string
  referrer?: string
  ip_address?: string
  user_agent?: string
}

export interface UpdateLeadInput {
  id: string
  name?: string
  email?: string
  phone?: string
  first_name?: string
  last_name?: string
  status?: LeadStatus
  expected_revenue?: number
  probability?: number
  custom_fields?: CustomFields
  is_new?: boolean
}

// Filter options for list queries
export interface LeadFilterOptions {
  status?: LeadStatus
  statuses?: LeadStatus[]  // Multiple status filter
  includeDeleted?: boolean
  limit?: number
  offset?: number
  search?: string
  orderBy?: keyof Lead
  orderDirection?: 'asc' | 'desc'
  utmSource?: string
  dateFrom?: string
  dateTo?: string
}

// KPI types
export interface LeadKPIs {
  totalLeads: number
  // Original status counts (for backward compatibility)
  newLeads: number
  contactedLeads: number
  customers: number
  lostLeads: number
  // Pipeline stage counts (new)
  followUpLeads: number    // new, no_answer, not_contacted
  warmLeads: number        // contacted, message_sent
  hotLeads: number         // meeting_set, pending_agreement
  signedLeads: number      // customer, signed
  futureLeads: number      // future_interest
  // All lost statuses: lost, not_relevant, closed_elsewhere
  allLostLeads: number
  // Rates
  conversionRate: number
  totalPipelineValue: number
  weightedPipelineValue: number
}

export interface UTMPerformance {
  source: string
  leadCount: number
  customerCount: number
  conversionRate: number
  totalRevenue: number
}

export interface TimeSeriesData {
  date: string
  // Canonical 14 statuses
  not_contacted: number
  no_answer: number
  contacted: number
  message_sent: number
  meeting_set: number
  pending_agreement: number
  signed: number
  under_review: number
  report_submitted: number
  missing_document: number
  completed: number
  not_relevant: number
  closed_elsewhere: number
  future_interest: number
}

export interface ConversionFunnelItem {
  stage: string
  stageHe: string
  count: number
  percentage: number
}
