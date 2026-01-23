import type { Database } from './database'

// Base types from database
export type Lead = Database['public']['Tables']['leads']['Row']
export type LeadInsert = Database['public']['Tables']['leads']['Insert']
export type LeadUpdate = Database['public']['Tables']['leads']['Update']

export type LeadEvent = Database['public']['Tables']['lead_events']['Row']
export type LeadEventInsert = Database['public']['Tables']['lead_events']['Insert']

// Application-level enums and types
export const LEAD_STATUSES = ['new', 'contacted', 'customer', 'lost'] as const
export type LeadStatus = typeof LEAD_STATUSES[number]

export const EVENT_TYPES = [
  'created',
  'updated',
  'field_changed',
  'status_changed',
  'deleted',
  'restored'
] as const
export type EventType = typeof EVENT_TYPES[number]

// Status configuration with Hebrew labels (Monday.com Light Theme)
export const STATUS_CONFIG: Record<LeadStatus, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  cssClass: string
}> = {
  new: {
    label: 'חדש',
    color: 'text-[#0073EA]',
    bgColor: 'bg-[#CCE5FF]',
    borderColor: 'border-transparent',
    cssClass: 'status-new'
  },
  contacted: {
    label: 'נוצר קשר',
    color: 'text-[#D17A00]',
    bgColor: 'bg-[#FFF0D6]',
    borderColor: 'border-transparent',
    cssClass: 'status-contacted'
  },
  customer: {
    label: 'לקוח',
    color: 'text-[#00854D]',
    bgColor: 'bg-[#D4F4DD]',
    borderColor: 'border-transparent',
    cssClass: 'status-customer'
  },
  lost: {
    label: 'אבוד',
    color: 'text-[#D83A52]',
    bgColor: 'bg-[#FFD6D9]',
    borderColor: 'border-transparent',
    cssClass: 'status-lost'
  }
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
  restored: { label: 'שוחזר', icon: 'RotateCcw', color: 'text-[#00A0B0]', bgColor: 'bg-[#D4F4F7]' }
}

// Custom fields structure (flexible JSON)
export interface CustomFields {
  [key: string]: string | number | boolean | null
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
  newLeads: number
  contactedLeads: number
  customers: number
  lostLeads: number
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
  new: number
  contacted: number
  customer: number
  lost: number
}

export interface ConversionFunnelItem {
  stage: string
  stageHe: string
  count: number
  percentage: number
}
