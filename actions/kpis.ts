'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/tables'
import { LEAD_STATUSES, STATUS_CONFIG, PIPELINE_STAGES } from '@/types/leads'
import type { LeadKPIs, UTMPerformance, ConversionFunnelItem, TimeSeriesData, LeadStatus, PipelineStage } from '@/types/leads'

// ============ DATA NORMALISATION HELPERS ============

// Maps deprecated status names → canonical equivalents
const DEPRECATED_TO_CANONICAL: Record<string, string> = {
  'new': 'not_contacted',
  'customer': 'payment_completed',
  'contacted': 'message_sent',
  'completed': 'waiting_for_payment',
  'paying_customer': 'payment_completed',
}

// All deprecated pre-sale statuses (including JSON-quoted variants) for inclusive event queries
const ALL_DEPRECATED_PRESALE_STATUSES: string[] = [
  'new', '"new"', 'customer', '"customer"', 'contacted', '"contacted"',
]

// Strip JSON-quoted event values: '"new"' → 'new'
function normaliseEventValue(value: string | null): string {
  if (!value) return ''
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1)
  return value
}

// Normalise deprecated status to canonical (after stripping quotes)
function canonicaliseStatus(value: string): string {
  return DEPRECATED_TO_CANONICAL[value] || value
}

// Helper to check authentication
async function requireAuth(): Promise<{ authenticated: true } | { authenticated: false; error: string }> {
  // Dev bypass - skip auth in development when BYPASS_AUTH is set
  if (process.env.BYPASS_AUTH === 'true') {
    return { authenticated: true }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { authenticated: false, error: 'Unauthorized' }
  }

  return { authenticated: true }
}

// Helper to determine pipeline stage for a status
function getPipelineStage(status: string): PipelineStage | null {
  for (const [stage, statuses] of Object.entries(PIPELINE_STAGES)) {
    if ((statuses as readonly string[]).includes(status)) {
      return stage as PipelineStage
    }
  }
  return null
}

// Date range filter type for KPI queries
interface DateFilter {
  from?: string  // ISO date string
  to?: string    // ISO date string
}

// Helper: Get lead IDs that entered specific statuses within a date range (via lead_events)
// Expanded to include deprecated + JSON-quoted variants, and filters self-transitions
async function getLeadIdsChangedToStatus(
  statuses: string[],
  dateFilter?: DateFilter
): Promise<string[]> {
  const supabase = await createClient()

  // Build expanded filter: include JSON-quoted and deprecated variants
  const expandedStatuses = new Set<string>(statuses)
  for (const s of statuses) {
    expandedStatuses.add(`"${s}"`) // JSON-quoted variant
  }
  // Also add deprecated names that map to any of the requested canonical statuses
  for (const [deprecated, canonical] of Object.entries(DEPRECATED_TO_CANONICAL)) {
    if (statuses.includes(canonical)) {
      expandedStatuses.add(deprecated)
      expandedStatuses.add(`"${deprecated}"`)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from(Tables.lead_events)
    .select('lead_id, old_value, new_value')
    .eq('event_type', 'status_changed')
    .in('new_value', [...expandedStatuses])

  if (dateFilter?.from) query = query.gte('created_at', dateFilter.from)
  if (dateFilter?.to) query = query.lte('created_at', dateFilter.to)

  const { data } = await query

  // Post-filter: skip self-transitions (old_value == new_value after normalisation)
  const leadIds = (data as { lead_id: string; old_value: string | null; new_value: string | null }[] || [])
    .filter((e) => {
      const normOld = normaliseEventValue(e.old_value)
      const normNew = normaliseEventValue(e.new_value)
      return normOld !== normNew
    })
    .map((e) => e.lead_id)

  return [...new Set(leadIds)]
}

// Internal implementation functions wrapped with React.cache
const getLeadKPIsInternal = cache(async (dateFilter?: DateFilter): Promise<LeadKPIs> => {
  const supabase = await createClient()

  // Get counts by status with optional date filter
  let statusQuery = supabase
    .from(Tables.leads)
    .select('status')
    .is('deleted_at', null)

  // Apply date filters if provided
  if (dateFilter?.from) {
    statusQuery = statusQuery.gte('created_at', dateFilter.from)
  }
  if (dateFilter?.to) {
    statusQuery = statusQuery.lte('created_at', dateFilter.to)
  }

  const { data: statusCounts } = await statusQuery

  // Initialize counts for all statuses
  const statusCountMap: Record<string, number> = {}
  LEAD_STATUSES.forEach(s => { statusCountMap[s] = 0 })

  // Pipeline stage counts
  const pipelineCounts: Record<PipelineStage, number> = {
    follow_up: 0,
    warm: 0,
    signed: 0,
    exit: 0,
    future: 0,
  }

  let total = 0

  statusCounts?.forEach((lead) => {
    const status = lead.status as LeadStatus
    if (status && status in statusCountMap) {
      statusCountMap[status]++
      total++

      // Also count by pipeline stage
      const stage = getPipelineStage(status)
      if (stage) {
        pipelineCounts[stage]++
      }
    }
  })

  // Get pipeline values with same date filter
  let pipelineQuery = supabase
    .from(Tables.leads)
    .select('expected_revenue, probability')
    .is('deleted_at', null)
    .not('expected_revenue', 'is', null)

  if (dateFilter?.from) {
    pipelineQuery = pipelineQuery.gte('created_at', dateFilter.from)
  }
  if (dateFilter?.to) {
    pipelineQuery = pipelineQuery.lte('created_at', dateFilter.to)
  }

  const { data: pipelineData } = await pipelineQuery

  let totalPipeline = 0
  let weightedPipeline = 0

  pipelineData?.forEach((lead) => {
    const revenue = lead.expected_revenue ?? 0
    const probability = (lead.probability ?? 50) / 100
    totalPipeline += revenue
    weightedPipeline += revenue * probability
  })

  // Get income KPIs — use lead_events for date filtering on revenue metrics
  const signedStatuses = [...PIPELINE_STAGES.signed] as string[]

  let expectedIncome = 0
  let amountCollected = 0
  let totalRefunds = 0

  if (dateFilter) {
    // Event-based: find leads that entered signed/payment statuses within date range
    const [signedLeadIds, paymentLeadIds] = await Promise.all([
      getLeadIdsChangedToStatus(signedStatuses, dateFilter),
      getLeadIdsChangedToStatus(['payment_completed'], dateFilter),
    ])

    const eventFoundSignedIds = new Set(signedLeadIds)

    // Fetch income data for leads that changed to signed statuses
    if (signedLeadIds.length > 0) {
      const { data: signedLeadsData } = await supabase
        .from(Tables.leads)
        .select('id, refund_amount, commission_rate, status')
        .is('deleted_at', null)
        .in('id', signedLeadIds)

      signedLeadsData?.forEach((lead) => {
        const refund = lead.refund_amount ?? 0
        const rate = (lead.commission_rate ?? 0) / 100
        expectedIncome += refund * rate
      })

      // Amount collected: only from leads that entered payment_completed in the period
      const paymentIdSet = new Set(paymentLeadIds)
      signedLeadsData?.forEach((lead) => {
        if (paymentIdSet.has(lead.id)) {
          const refund = lead.refund_amount ?? 0
          const rate = (lead.commission_rate ?? 0) / 100
          amountCollected += refund * rate
        }
      })
    }

    // Hybrid fallback: for signed-stage leads NOT found via events, include revenue from current status
    // This catches "ghost" leads with no status_changed events (e.g. payment_completed leads from before event tracking)
    let fallbackQuery = supabase
      .from(Tables.leads)
      .select('id, refund_amount, commission_rate, status')
      .is('deleted_at', null)
      .not('refund_amount', 'is', null)
      .in('status', signedStatuses)

    if (dateFilter.from) fallbackQuery = fallbackQuery.gte('created_at', dateFilter.from)
    if (dateFilter.to) fallbackQuery = fallbackQuery.lte('created_at', dateFilter.to)

    const { data: fallbackData } = await fallbackQuery
    fallbackData?.forEach((lead) => {
      if (!eventFoundSignedIds.has(lead.id)) {
        const refund = lead.refund_amount ?? 0
        const rate = (lead.commission_rate ?? 0) / 100
        expectedIncome += refund * rate
        if (lead.status === 'payment_completed') {
          amountCollected += refund * rate
        }
      }
    })

    // Refunds still use cohort (created_at) approach
    let refundQuery = supabase
      .from(Tables.leads)
      .select('refund_amount')
      .is('deleted_at', null)
      .not('refund_amount', 'is', null)

    if (dateFilter.from) refundQuery = refundQuery.gte('created_at', dateFilter.from)
    if (dateFilter.to) refundQuery = refundQuery.lte('created_at', dateFilter.to)

    const { data: refundData } = await refundQuery
    refundData?.forEach((lead) => { totalRefunds += lead.refund_amount ?? 0 })
  } else {
    // No date filter — original approach (all leads)
    const { data: incomeData } = await supabase
      .from(Tables.leads)
      .select('refund_amount, commission_rate, status')
      .is('deleted_at', null)
      .not('refund_amount', 'is', null)

    incomeData?.forEach((lead) => {
      const refund = lead.refund_amount ?? 0
      const rate = (lead.commission_rate ?? 0) / 100
      const commission = refund * rate

      totalRefunds += refund

      if (signedStatuses.includes(lead.status as string)) {
        expectedIncome += commission
      }
      if (lead.status === 'payment_completed') {
        amountCollected += commission
      }
    })
  }

  // Calculate signed rate (customer + signed statuses)
  const signedCount = pipelineCounts.signed

  // Count paying customers separately
  const payingCustomerCount = statusCountMap.paying_customer || 0

  return {
    totalLeads: total,
    // Original status counts (for backward compatibility)
    newLeads: statusCountMap.new,
    contactedLeads: statusCountMap.contacted,
    customers: statusCountMap.customer,
    lostLeads: statusCountMap.lost,
    // Pipeline stage counts
    followUpLeads: pipelineCounts.follow_up,
    warmLeads: pipelineCounts.warm,
    signedLeads: pipelineCounts.signed,
    futureLeads: pipelineCounts.future,
    exitLeads: pipelineCounts.exit,
    payingCustomers: payingCustomerCount,
    // Rates
    conversionRate: total > 0 ? (signedCount / total) * 100 : 0,
    totalPipelineValue: totalPipeline,
    weightedPipelineValue: weightedPipeline,
    expectedIncome,
    amountCollected,
    totalRefunds,
  }
})

const getConversionFunnelInternal = cache(async (dateFilter?: DateFilter): Promise<ConversionFunnelItem[]> => {
  const supabase = await createClient()

  let query = supabase
    .from(Tables.leads)
    .select('status')
    .is('deleted_at', null)

  if (dateFilter?.from) {
    query = query.gte('created_at', dateFilter.from)
  }
  if (dateFilter?.to) {
    query = query.lte('created_at', dateFilter.to)
  }

  const { data } = await query

  // Initialize counts for all statuses
  const counts: Record<string, number> = {}
  LEAD_STATUSES.forEach(s => { counts[s] = 0 })

  let total = 0

  data?.forEach((lead) => {
    if (lead.status && lead.status in counts) {
      counts[lead.status]++
      total++
    }
  })

  // Return funnel by pipeline stage (grouped)
  const stageLabels: Record<PipelineStage, string> = {
    follow_up: 'מעקב',
    warm: 'חמים',
    signed: 'סגירה',
    exit: 'יציאה ממשפך',
    future: 'עתידי',
  }

  return (Object.keys(PIPELINE_STAGES) as PipelineStage[]).map(stage => {
    const stageStatuses = PIPELINE_STAGES[stage] as readonly string[]
    const stageCount = stageStatuses.reduce((sum, s) => sum + (counts[s] || 0), 0)
    return {
      stage,
      stageHe: stageLabels[stage],
      count: stageCount,
      percentage: total ? (stageCount / total) * 100 : 0,
    }
  })
})

// Sub-status item for detailed breakdown
export interface SubStatusItem {
  status: string
  statusHe: string
  count: number
  percentage: number
  stage: PipelineStage
}

const getSubStatusBreakdownInternal = cache(async (dateFilter?: DateFilter): Promise<SubStatusItem[]> => {
  const supabase = await createClient()

  let query = supabase
    .from(Tables.leads)
    .select('status')
    .is('deleted_at', null)

  if (dateFilter?.from) {
    query = query.gte('created_at', dateFilter.from)
  }
  if (dateFilter?.to) {
    query = query.lte('created_at', dateFilter.to)
  }

  const { data } = await query

  // Count by individual status
  const counts: Record<string, number> = {}
  LEAD_STATUSES.forEach(s => { counts[s] = 0 })

  let total = 0

  data?.forEach((lead) => {
    if (lead.status && lead.status in counts) {
      counts[lead.status]++
      total++
    }
  })

  // Return breakdown for statuses that typically need sub-breakdown
  // Focus on follow_up and warm stages where "אין מענה" type statuses live
  const relevantStages: PipelineStage[] = ['follow_up', 'warm']

  const results: SubStatusItem[] = []

  for (const stage of relevantStages) {
    const stageStatuses = PIPELINE_STAGES[stage] as readonly string[]
    for (const status of stageStatuses) {
      const count = counts[status] || 0
      if (count > 0) {
        const config = STATUS_CONFIG[status as LeadStatus]
        results.push({
          status,
          statusHe: config?.label || status,
          count,
          percentage: total ? (count / total) * 100 : 0,
          stage,
        })
      }
    }
  }

  // Sort by count descending
  return results.sort((a, b) => b.count - a.count)
})

const getUTMPerformanceInternal = cache(async (dateFilter?: DateFilter): Promise<UTMPerformance[]> => {
  const supabase = await createClient()

  let query = supabase
    .from(Tables.leads)
    .select('utm_source, status, expected_revenue')
    .is('deleted_at', null)
    .not('utm_source', 'is', null)

  if (dateFilter?.from) {
    query = query.gte('created_at', dateFilter.from)
  }
  if (dateFilter?.to) {
    query = query.lte('created_at', dateFilter.to)
  }

  const { data } = await query

  const performanceMap = new Map<string, {
    leadCount: number
    customerCount: number
    totalRevenue: number
  }>()

  // Signed stage statuses count as conversions
  const signedStatuses = PIPELINE_STAGES.signed as readonly string[]

  data?.forEach((lead) => {
    const source = lead.utm_source ?? 'direct'
    const existing = performanceMap.get(source) ?? {
      leadCount: 0,
      customerCount: 0,
      totalRevenue: 0,
    }

    existing.leadCount++
    // Count any signed-stage status as a conversion
    if (signedStatuses.includes(lead.status as string)) {
      existing.customerCount++
      existing.totalRevenue += lead.expected_revenue ?? 0
    }

    performanceMap.set(source, existing)
  })

  return Array.from(performanceMap.entries())
    .map(([source, stats]) => ({
      source,
      leadCount: stats.leadCount,
      customerCount: stats.customerCount,
      conversionRate: stats.leadCount > 0
        ? (stats.customerCount / stats.leadCount) * 100
        : 0,
      totalRevenue: stats.totalRevenue,
    }))
    .sort((a, b) => b.leadCount - a.leadCount)
    .slice(0, 5)
})

// Helper to create empty status count object
function createEmptyStatusCounts(): Record<LeadStatus, number> {
  const counts: Partial<Record<LeadStatus, number>> = {}
  LEAD_STATUSES.forEach(s => { counts[s] = 0 })
  return counts as Record<LeadStatus, number>
}

const getTimeSeriesTrendsInternal = cache(async (days: number = 30): Promise<TimeSeriesData[]> => {
  const supabase = await createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data } = await supabase
    .from(Tables.leads)
    .select('created_at, status')
    .is('deleted_at', null)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })

  // Group by date
  const dateMap = new Map<string, Record<LeadStatus, number>>()

  data?.forEach((lead) => {
    const date = new Date(lead.created_at!).toISOString().split('T')[0]
    const existing = dateMap.get(date) ?? createEmptyStatusCounts()

    const status = lead.status as LeadStatus
    if (status && LEAD_STATUSES.includes(status)) {
      existing[status]++
    }

    dateMap.set(date, existing)
  })

  // Fill in missing dates
  const result: TimeSeriesData[] = []
  const currentDate = new Date(startDate)
  const endDate = new Date()

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const counts = dateMap.get(dateStr) ?? createEmptyStatusCounts()
    result.push({
      date: dateStr,
      // Canonical 14 statuses
      not_contacted: counts.not_contacted ?? 0,
      no_answer: counts.no_answer ?? 0,
      message_sent: counts.message_sent ?? 0,
      meeting_set: counts.meeting_set ?? 0,
      pending_agreement: counts.pending_agreement ?? 0,
      signed: counts.signed ?? 0,
      under_review: counts.under_review ?? 0,
      report_submitted: counts.report_submitted ?? 0,
      missing_document: counts.missing_document ?? 0,
      waiting_for_payment: counts.waiting_for_payment ?? 0,
      payment_completed: counts.payment_completed ?? 0,
      not_relevant: counts.not_relevant ?? 0,
      closed_elsewhere: counts.closed_elsewhere ?? 0,
      no_refund: counts.no_refund ?? 0,
      future_interest: counts.future_interest ?? 0,
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return result
})

const getRecentActivityInternal = cache(async (limit: number = 5): Promise<{
  id: string
  lead_name: string
  event_type: string
  created_at: string
  user_email: string | null
}[]> => {
  const supabase = await createClient()
  const isDev = process.env.BYPASS_AUTH === 'true'

  // In dev mode, we need to query separately since dev tables don't have FK relations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eventsQuery = (supabase as any)
    .from(Tables.lead_events)
    .select(isDev ? 'id, event_type, created_at, user_email, lead_id' : `
      id,
      event_type,
      created_at,
      user_email,
      lead_id,
      leads!inner(name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  const { data: events } = await eventsQuery

  if (!events || events.length === 0) return []

  // For dev mode, fetch lead names separately
  if (isDev) {
    const leadIds = events.map((e: { lead_id: string }) => e.lead_id).filter(Boolean)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: leads } = await (supabase as any)
      .from(Tables.leads)
      .select('id, name')
      .in('id', leadIds)

    const leadMap = new Map(leads?.map((l: { id: string; name: string }) => [l.id, l.name]) ?? [])

    return events.map((event: { id: string; lead_id: string; event_type: string; created_at: string; user_email: string | null }) => ({
      id: event.id,
      lead_name: leadMap.get(event.lead_id) || 'Unknown',
      event_type: event.event_type,
      created_at: event.created_at!,
      user_email: event.user_email,
    }))
  }

  return events.map((event: { id: string; leads: { name: string }; event_type: string; created_at: string; user_email: string | null }) => ({
    id: event.id,
    lead_name: event.leads?.name || 'Unknown',
    event_type: event.event_type,
    created_at: event.created_at!,
    user_email: event.user_email,
  }))
})

// Exported functions with authentication checks
export async function getLeadKPIs(dateFrom?: string, dateTo?: string): Promise<LeadKPIs> {
  const authResult = await requireAuth()
  if (!authResult.authenticated) {
    throw new Error(authResult.error)
  }
  const dateFilter = (dateFrom || dateTo) ? { from: dateFrom, to: dateTo } : undefined
  return getLeadKPIsInternal(dateFilter)
}

export async function getConversionFunnel(dateFrom?: string, dateTo?: string): Promise<ConversionFunnelItem[]> {
  const authResult = await requireAuth()
  if (!authResult.authenticated) {
    throw new Error(authResult.error)
  }
  const dateFilter = (dateFrom || dateTo) ? { from: dateFrom, to: dateTo } : undefined
  return getConversionFunnelInternal(dateFilter)
}

export async function getSubStatusBreakdown(dateFrom?: string, dateTo?: string): Promise<SubStatusItem[]> {
  const authResult = await requireAuth()
  if (!authResult.authenticated) {
    throw new Error(authResult.error)
  }
  const dateFilter = (dateFrom || dateTo) ? { from: dateFrom, to: dateTo } : undefined
  return getSubStatusBreakdownInternal(dateFilter)
}

export async function getUTMPerformance(dateFrom?: string, dateTo?: string): Promise<UTMPerformance[]> {
  const authResult = await requireAuth()
  if (!authResult.authenticated) {
    throw new Error(authResult.error)
  }
  const dateFilter = (dateFrom || dateTo) ? { from: dateFrom, to: dateTo } : undefined
  return getUTMPerformanceInternal(dateFilter)
}

export async function getTimeSeriesTrends(days: number = 30): Promise<TimeSeriesData[]> {
  const authResult = await requireAuth()
  if (!authResult.authenticated) {
    throw new Error(authResult.error)
  }
  return getTimeSeriesTrendsInternal(days)
}

export async function getRecentActivity(limit: number = 5): Promise<{
  id: string
  lead_name: string
  event_type: string
  created_at: string
  user_email: string | null
}[]> {
  const authResult = await requireAuth()
  if (!authResult.authenticated) {
    throw new Error(authResult.error)
  }
  return getRecentActivityInternal(limit)
}

// ============ NEW DASHBOARD DATA ============

// Daily leads trend
export interface DailyTrend {
  date: string
  total: number
  converted: number        // follow_up/warm → signed (actual sale)
  paymentCompleted: number // → payment_completed (money collected)
}

export interface TrendTransaction {
  lead_id: string
  lead_name: string
  old_value: string
  new_value: string
  created_at: string
  type: 'sale' | 'payment'
}

export interface DailyTrendsResult {
  trends: DailyTrend[]
  transactions: TrendTransaction[]
}

const getDailyTrendsInternal = cache(async (days: number = 30, dateFilter?: DateFilter): Promise<DailyTrendsResult> => {
  const supabase = await createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const fromDate = dateFilter?.from || startDate.toISOString()

  // Query 1: Total leads per day by created_at (cohort)
  let leadsQuery = supabase
    .from(Tables.leads)
    .select('created_at')
    .is('deleted_at', null)
    .gte('created_at', fromDate)

  if (dateFilter?.to) {
    leadsQuery = leadsQuery.lte('created_at', dateFilter.to)
  }

  // Query 2: All status_changed events in the period (we classify them locally)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let eventsQuery = (supabase as any)
    .from(Tables.lead_events)
    .select('lead_id, old_value, new_value, created_at')
    .eq('event_type', 'status_changed')
    .gte('created_at', fromDate)

  if (dateFilter?.to) {
    eventsQuery = eventsQuery.lte('created_at', dateFilter.to)
  }

  const [{ data: leadsData }, { data: eventsData }] = await Promise.all([
    leadsQuery,
    eventsQuery,
  ])

  // Classify events and keep only last qualifying event per lead per category
  const followUpStatuses = [...PIPELINE_STAGES.follow_up] as string[]
  const warmStatuses = [...PIPELINE_STAGES.warm] as string[]
  const signedStatuses = [...PIPELINE_STAGES.signed] as string[]
  const exitStatuses = [...PIPELINE_STAGES.exit] as string[]
  // Expanded: any pre-signed status (including deprecated) can be a "from" status for a sale
  const saleFromStatuses = [
    ...followUpStatuses, ...warmStatuses,
    // Deprecated statuses that also represent pre-sale stages
    'new', 'contacted', 'customer',
    // Exit statuses (a lead can come back from exit → signed)
    ...exitStatuses,
  ]

  type EventRecord = { lead_id: string; old_value: string; new_value: string; created_at: string }

  // Maps: lead_id → last qualifying event (with normalised values for display)
  const lastSalePerLead = new Map<string, EventRecord>()
  const lastPaymentPerLead = new Map<string, EventRecord>()

  ;(eventsData as EventRecord[] | null)?.forEach((event) => {
    // Normalise values: strip JSON quotes
    const normOld = normaliseEventValue(event.old_value)
    const normNew = normaliseEventValue(event.new_value)

    // Skip self-transitions after normalisation
    if (normOld === normNew) return

    // Canonicalise for classification (e.g. 'new' → 'not_contacted')
    const canonOld = canonicaliseStatus(normOld)
    const canonNew = canonicaliseStatus(normNew)

    // Build a normalised event record for storage (display-friendly values)
    const normEvent: EventRecord = {
      lead_id: event.lead_id,
      old_value: normOld,
      new_value: normNew,
      created_at: event.created_at,
    }

    // Sale: pre-sale status → signed stage (using canonical names for matching)
    if (
      (saleFromStatuses.includes(normOld) || saleFromStatuses.includes(canonOld)) &&
      (signedStatuses.includes(normNew) || signedStatuses.includes(canonNew))
    ) {
      const existing = lastSalePerLead.get(event.lead_id)
      if (!existing || event.created_at > existing.created_at) {
        lastSalePerLead.set(event.lead_id, normEvent)
      }
    }
    // Payment: anything → payment_completed (including deprecated 'customer', 'paying_customer')
    if (canonNew === 'payment_completed') {
      const existing = lastPaymentPerLead.get(event.lead_id)
      if (!existing || event.created_at > existing.created_at) {
        lastPaymentPerLead.set(event.lead_id, normEvent)
      }
    }
  })

  // Count total leads per day
  const totalMap = new Map<string, number>()
  leadsData?.forEach((lead: { created_at: string | null }) => {
    const date = new Date(lead.created_at!).toISOString().split('T')[0]
    totalMap.set(date, (totalMap.get(date) || 0) + 1)
  })

  // Count sales per day (last event per lead)
  const convertedMap = new Map<string, number>()
  lastSalePerLead.forEach((event) => {
    const date = new Date(event.created_at).toISOString().split('T')[0]
    convertedMap.set(date, (convertedMap.get(date) || 0) + 1)
  })

  // Count payments per day (last event per lead)
  const paymentMap = new Map<string, number>()
  lastPaymentPerLead.forEach((event) => {
    const date = new Date(event.created_at).toISOString().split('T')[0]
    paymentMap.set(date, (paymentMap.get(date) || 0) + 1)
  })

  // Batch-fetch lead names for transactions table
  const allLeadIds = new Set<string>([...lastSalePerLead.keys(), ...lastPaymentPerLead.keys()])
  const leadNameMap = new Map<string, string>()

  if (allLeadIds.size > 0) {
    const { data: leadsInfo } = await supabase
      .from(Tables.leads)
      .select('id, name')
      .in('id', [...allLeadIds])

    leadsInfo?.forEach((lead) => {
      leadNameMap.set(lead.id, lead.name || 'ללא שם')
    })
  }

  // Build transactions list
  const transactions: TrendTransaction[] = []
  lastSalePerLead.forEach((event) => {
    transactions.push({
      lead_id: event.lead_id,
      lead_name: leadNameMap.get(event.lead_id) || 'ללא שם',
      old_value: event.old_value,
      new_value: event.new_value,
      created_at: event.created_at,
      type: 'sale',
    })
  })
  lastPaymentPerLead.forEach((event) => {
    transactions.push({
      lead_id: event.lead_id,
      lead_name: leadNameMap.get(event.lead_id) || 'ללא שם',
      old_value: event.old_value,
      new_value: event.new_value,
      created_at: event.created_at,
      type: 'payment',
    })
  })

  // Sort transactions by date descending
  transactions.sort((a, b) => b.created_at.localeCompare(a.created_at))

  // Fill missing dates
  const trends: DailyTrend[] = []
  const current = new Date(dateFilter?.from || startDate)
  const end = dateFilter?.to ? new Date(dateFilter.to) : new Date()

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    trends.push({
      date: dateStr,
      total: totalMap.get(dateStr) || 0,
      converted: convertedMap.get(dateStr) || 0,
      paymentCompleted: paymentMap.get(dateStr) || 0,
    })
    current.setDate(current.getDate() + 1)
  }

  return { trends, transactions }
})

export async function getDailyTrends(days: number = 30, dateFrom?: string, dateTo?: string): Promise<DailyTrendsResult> {
  const authResult = await requireAuth()
  if (!authResult.authenticated) throw new Error(authResult.error)
  const dateFilter = (dateFrom || dateTo) ? { from: dateFrom, to: dateTo } : undefined
  return getDailyTrendsInternal(days, dateFilter)
}

// Source performance with full metrics
export interface SourcePerformance {
  source: string
  leads: number
  converted: number
  conversionRate: number
  revenue: number
  avgDealSize: number
}

const getSourcePerformanceInternal = cache(async (dateFilter?: DateFilter): Promise<EnhancedSourcePerformance[]> => {
  const supabase = await createClient()

  let query = supabase
    .from(Tables.leads)
    .select('id, created_at, utm_source, source, status, refund_amount, commission_rate')
    .is('deleted_at', null)

  if (dateFilter?.from) query = query.gte('created_at', dateFilter.from)
  if (dateFilter?.to) query = query.lte('created_at', dateFilter.to)

  const { data } = await query

  const signedStatuses = PIPELINE_STAGES.signed as readonly string[]
  const sourceMap = new Map<string, {
    leads: number; converted: number; revenue: number
    paymentCompleted: number
    leadCreationDates: Map<string, string> // lead_id → created_at
  }>()

  data?.forEach((lead) => {
    const src = lead.utm_source || lead.source || 'ישיר'
    const existing = sourceMap.get(src) ?? {
      leads: 0, converted: 0, revenue: 0, paymentCompleted: 0,
      leadCreationDates: new Map(),
    }
    existing.leads++
    if (signedStatuses.includes(lead.status as string)) {
      existing.converted++
      const refund = lead.refund_amount ?? 0
      const rate = (lead.commission_rate ?? 0) / 100
      existing.revenue += refund * rate
      existing.leadCreationDates.set(lead.id, lead.created_at!)
      if (lead.status === 'payment_completed') {
        existing.paymentCompleted++
      }
    }
    sourceMap.set(src, existing)
  })

  // Fetch first signed event per lead for avg days calculation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: signedEvents } = await (supabase as any)
    .from(Tables.lead_events)
    .select('lead_id, new_value, created_at')
    .eq('event_type', 'status_changed')
    .in('new_value', [...signedStatuses])
    .order('created_at', { ascending: true })

  // First signed event per lead
  const firstSignedEvent = new Map<string, string>()
  ;(signedEvents as { lead_id: string; new_value: string; created_at: string }[] || []).forEach((e) => {
    if (!firstSignedEvent.has(e.lead_id)) {
      firstSignedEvent.set(e.lead_id, e.created_at)
    }
  })

  return Array.from(sourceMap.entries())
    .map(([source, stats]) => {
      // Avg days to convert for this source
      let totalDays = 0
      let daysSampleCount = 0
      stats.leadCreationDates.forEach((createdAt, leadId) => {
        const signedAt = firstSignedEvent.get(leadId)
        if (signedAt) {
          const days = (new Date(signedAt).getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
          if (days >= 0) {
            totalDays += days
            daysSampleCount++
          }
        }
      })

      return {
        source,
        leads: stats.leads,
        converted: stats.converted,
        conversionRate: stats.leads > 0 ? (stats.converted / stats.leads) * 100 : 0,
        revenue: stats.revenue,
        avgDealSize: stats.converted > 0 ? stats.revenue / stats.converted : 0,
        collectionRate: stats.converted > 0 ? (stats.paymentCompleted / stats.converted) * 100 : 0,
        avgDaysToConvert: daysSampleCount > 0 ? Math.round((totalDays / daysSampleCount) * 10) / 10 : 0,
      }
    })
    .sort((a, b) => b.leads - a.leads)
})

export async function getSourcePerformance(dateFrom?: string, dateTo?: string): Promise<EnhancedSourcePerformance[]> {
  const authResult = await requireAuth()
  if (!authResult.authenticated) throw new Error(authResult.error)
  const dateFilter = (dateFrom || dateTo) ? { from: dateFrom, to: dateTo } : undefined
  return getSourcePerformanceInternal(dateFilter)
}

// Campaign performance
export interface CampaignPerformance {
  campaign: string
  leads: number
  converted: number
  conversionRate: number
  revenue: number
}

const getCampaignPerformanceInternal = cache(async (dateFilter?: DateFilter): Promise<CampaignPerformance[]> => {
  const supabase = await createClient()

  let query = supabase
    .from(Tables.leads)
    .select('utm_campaign, status, refund_amount, commission_rate')
    .is('deleted_at', null)
    .not('utm_campaign', 'is', null)

  if (dateFilter?.from) query = query.gte('created_at', dateFilter.from)
  if (dateFilter?.to) query = query.lte('created_at', dateFilter.to)

  const { data } = await query

  const signedStatuses = PIPELINE_STAGES.signed as readonly string[]
  const campaignMap = new Map<string, { leads: number; converted: number; revenue: number }>()

  data?.forEach((lead) => {
    const campaign = lead.utm_campaign || 'unknown'
    const existing = campaignMap.get(campaign) ?? { leads: 0, converted: 0, revenue: 0 }
    existing.leads++
    if (signedStatuses.includes(lead.status as string)) {
      existing.converted++
      const refund = lead.refund_amount ?? 0
      const rate = (lead.commission_rate ?? 0) / 100
      existing.revenue += refund * rate
    }
    campaignMap.set(campaign, existing)
  })

  return Array.from(campaignMap.entries())
    .map(([campaign, stats]) => ({
      campaign,
      leads: stats.leads,
      converted: stats.converted,
      conversionRate: stats.leads > 0 ? (stats.converted / stats.leads) * 100 : 0,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 10)
})

export async function getCampaignPerformance(dateFrom?: string, dateTo?: string): Promise<CampaignPerformance[]> {
  const authResult = await requireAuth()
  if (!authResult.authenticated) throw new Error(authResult.error)
  const dateFilter = (dateFrom || dateTo) ? { from: dateFrom, to: dateTo } : undefined
  return getCampaignPerformanceInternal(dateFilter)
}

// Detailed status breakdown (all statuses with their actual counts)
export interface StatusBreakdown {
  status: string
  statusHe: string
  count: number
  revenue: number
  stage: PipelineStage
  stageHe: string
}

const getStatusBreakdownInternal = cache(async (dateFilter?: DateFilter): Promise<StatusBreakdown[]> => {
  const supabase = await createClient()

  const stageLabels: Record<PipelineStage, string> = {
    follow_up: 'מעקב',
    warm: 'חמים',
    signed: 'סגירה',
    exit: 'יציאה ממשפך',
    future: 'עתידי',
  }

  if (dateFilter) {
    // Event-based: find the latest status change per lead within the date range
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let eventsQuery = (supabase as any)
      .from(Tables.lead_events)
      .select('lead_id, old_value, new_value, created_at')
      .eq('event_type', 'status_changed')
      .not('new_value', 'is', null)

    if (dateFilter.from) eventsQuery = eventsQuery.gte('created_at', dateFilter.from)
    if (dateFilter.to) eventsQuery = eventsQuery.lte('created_at', dateFilter.to)

    const { data: events } = await eventsQuery

    // Keep only the latest status change per lead (normalised, skip self-transitions)
    const latestPerLead = new Map<string, { status: string; created_at: string }>()
    const eventLeadIds = new Set<string>()

    ;(events as { lead_id: string; old_value: string | null; new_value: string; created_at: string }[] | null)?.forEach((event) => {
      const normOld = normaliseEventValue(event.old_value)
      const normNew = normaliseEventValue(event.new_value)

      // Skip self-transitions after normalisation
      if (normOld === normNew) return

      // Canonicalise deprecated statuses for classification
      const canonNew = canonicaliseStatus(normNew)

      eventLeadIds.add(event.lead_id)

      const existing = latestPerLead.get(event.lead_id)
      if (!existing || event.created_at > existing.created_at) {
        latestPerLead.set(event.lead_id, { status: canonNew, created_at: event.created_at })
      }
    })

    // Hybrid fallback: for leads in the date window (by created_at) that have NO status_changed events,
    // fall back to their current leads.status
    let fallbackQuery = supabase
      .from(Tables.leads)
      .select('id, status, expected_revenue')
      .is('deleted_at', null)

    if (dateFilter.from) fallbackQuery = fallbackQuery.gte('created_at', dateFilter.from)
    if (dateFilter.to) fallbackQuery = fallbackQuery.lte('created_at', dateFilter.to)

    const { data: fallbackLeads } = await fallbackQuery

    fallbackLeads?.forEach((lead) => {
      if (!eventLeadIds.has(lead.id) && lead.status) {
        latestPerLead.set(lead.id, { status: lead.status, created_at: '' })
      }
    })

    // Build revenue map for all leads in latestPerLead
    const leadIds = [...latestPerLead.keys()]
    const revenueMap = new Map<string, number>()
    if (leadIds.length > 0) {
      // Batch in chunks of 100 to avoid URL length limits
      for (let i = 0; i < leadIds.length; i += 100) {
        const chunk = leadIds.slice(i, i + 100)
        const { data: leadsData } = await supabase
          .from(Tables.leads)
          .select('id, expected_revenue')
          .is('deleted_at', null)
          .in('id', chunk)

        leadsData?.forEach((lead) => {
          revenueMap.set(lead.id, lead.expected_revenue ?? 0)
        })
      }
    }

    // Group by status
    const statusMap = new Map<string, { count: number; revenue: number }>()
    latestPerLead.forEach(({ status }, leadId) => {
      const canonStatus = canonicaliseStatus(status)
      const existing = statusMap.get(canonStatus) ?? { count: 0, revenue: 0 }
      existing.count++
      existing.revenue += revenueMap.get(leadId) ?? 0
      statusMap.set(canonStatus, existing)
    })

    return Array.from(statusMap.entries())
      .map(([status, stats]) => {
        const config = STATUS_CONFIG[status as LeadStatus]
        const stage = getPipelineStage(status) || 'follow_up'
        return {
          status,
          statusHe: config?.label || status,
          count: stats.count,
          revenue: stats.revenue,
          stage,
          stageHe: stageLabels[stage],
        }
      })
      .filter(s => s.count > 0)
      .sort((a, b) => b.count - a.count)
  }

  // No date filter — original approach
  const { data } = await supabase
    .from(Tables.leads)
    .select('status, expected_revenue')
    .is('deleted_at', null)

  const statusMap = new Map<string, { count: number; revenue: number }>()

  data?.forEach((lead) => {
    const status = lead.status || 'new'
    const existing = statusMap.get(status) ?? { count: 0, revenue: 0 }
    existing.count++
    existing.revenue += lead.expected_revenue ?? 0
    statusMap.set(status, existing)
  })

  return Array.from(statusMap.entries())
    .map(([status, stats]) => {
      const config = STATUS_CONFIG[status as LeadStatus]
      const stage = getPipelineStage(status) || 'follow_up'
      return {
        status,
        statusHe: config?.label || status,
        count: stats.count,
        revenue: stats.revenue,
        stage,
        stageHe: stageLabels[stage],
      }
    })
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count)
})

export async function getStatusBreakdown(dateFrom?: string, dateTo?: string): Promise<StatusBreakdown[]> {
  const authResult = await requireAuth()
  if (!authResult.authenticated) throw new Error(authResult.error)
  const dateFilter = (dateFrom || dateTo) ? { from: dateFrom, to: dateTo } : undefined
  return getStatusBreakdownInternal(dateFilter)
}

// ============ SOURCE TRENDS OVER TIME ============

// Daily leads by source for stacked area chart
export interface SourceTrendDay {
  date: string
  [source: string]: number | string  // dynamic source keys + date string
}

const getSourceTrendsInternal = cache(async (days: number = 30, dateFilter?: DateFilter): Promise<{
  data: SourceTrendDay[]
  sources: string[]
}> => {
  const supabase = await createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  let query = supabase
    .from(Tables.leads)
    .select('created_at, utm_source, source')
    .is('deleted_at', null)
    .gte('created_at', dateFilter?.from || startDate.toISOString())

  if (dateFilter?.to) {
    query = query.lte('created_at', dateFilter.to)
  }

  const { data } = await query

  // Track all unique sources
  const allSources = new Set<string>()

  // Group by date and source
  const dateSourceMap = new Map<string, Map<string, number>>()

  data?.forEach((lead) => {
    const date = new Date(lead.created_at!).toISOString().split('T')[0]
    const src = lead.utm_source || lead.source || 'ישיר'

    allSources.add(src)

    if (!dateSourceMap.has(date)) {
      dateSourceMap.set(date, new Map())
    }
    const sourceMap = dateSourceMap.get(date)!
    sourceMap.set(src, (sourceMap.get(src) || 0) + 1)
  })

  // Sort sources by total count (descending) and take top 6
  const sourceTotals = new Map<string, number>()
  dateSourceMap.forEach((sourceMap) => {
    sourceMap.forEach((count, source) => {
      sourceTotals.set(source, (sourceTotals.get(source) || 0) + count)
    })
  })

  const topSources = Array.from(sourceTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([source]) => source)

  // Fill missing dates and build result
  const result: SourceTrendDay[] = []
  const current = new Date(dateFilter?.from || startDate)
  const end = dateFilter?.to ? new Date(dateFilter.to) : new Date()

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    const sourceMap = dateSourceMap.get(dateStr) || new Map()

    const dayData: SourceTrendDay = { date: dateStr }

    // Add counts for top sources
    topSources.forEach((source) => {
      dayData[source] = sourceMap.get(source) || 0
    })

    // Add "אחר" (other) for remaining sources
    let otherCount = 0
    sourceMap.forEach((count, source) => {
      if (!topSources.includes(source)) {
        otherCount += count
      }
    })
    if (allSources.size > topSources.length) {
      dayData['אחר'] = otherCount
    }

    result.push(dayData)
    current.setDate(current.getDate() + 1)
  }

  const sources = allSources.size > topSources.length
    ? [...topSources, 'אחר']
    : topSources

  return { data: result, sources }
})

export async function getSourceTrends(days: number = 30, dateFrom?: string, dateTo?: string): Promise<{
  data: SourceTrendDay[]
  sources: string[]
}> {
  const authResult = await requireAuth()
  if (!authResult.authenticated) throw new Error(authResult.error)
  const dateFilter = (dateFrom || dateTo) ? { from: dateFrom, to: dateTo } : undefined
  return getSourceTrendsInternal(days, dateFilter)
}

// ============ DATA QUALITY STATS (Phase 3) ============

export interface DataQualityResult {
  totalLeadsInWindow: number
  leadsWithEvents: number
  eventCoverage: number           // ratio 0-1
  expectedIncomeStatusBased: number
  amountCollectedStatusBased: number
  totalSignedLeads: number        // actual signed count for trend chart context
}

const getDataQualityStatsInternal = cache(async (dateFilter?: DateFilter): Promise<DataQualityResult> => {
  const supabase = await createClient()
  const signedStatuses = [...PIPELINE_STAGES.signed] as string[]

  // Query 1: total leads in window
  let leadsQuery = supabase
    .from(Tables.leads)
    .select('id, status, refund_amount, commission_rate')
    .is('deleted_at', null)

  if (dateFilter?.from) leadsQuery = leadsQuery.gte('created_at', dateFilter.from)
  if (dateFilter?.to) leadsQuery = leadsQuery.lte('created_at', dateFilter.to)

  // Query 2: lead IDs with status_changed events in the window
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let eventsQuery = (supabase as any)
    .from(Tables.lead_events)
    .select('lead_id')
    .eq('event_type', 'status_changed')

  if (dateFilter?.from) eventsQuery = eventsQuery.gte('created_at', dateFilter.from)
  if (dateFilter?.to) eventsQuery = eventsQuery.lte('created_at', dateFilter.to)

  const [{ data: leadsData }, { data: eventsData }] = await Promise.all([leadsQuery, eventsQuery])

  const totalLeadsInWindow = leadsData?.length || 0

  // Unique lead IDs with events
  const eventLeadIds = new Set((eventsData as { lead_id: string }[] || []).map(e => e.lead_id))
  // Only count leads that are actually in the window
  const leadIdsInWindow = new Set((leadsData || []).map((l) => l.id))
  const leadsWithEvents = [...eventLeadIds].filter(id => leadIdsInWindow.has(id)).length
  const eventCoverage = totalLeadsInWindow > 0 ? leadsWithEvents / totalLeadsInWindow : 1

  // Status-based ground truth: revenue from current status
  let expectedIncomeStatusBased = 0
  let amountCollectedStatusBased = 0
  let totalSignedLeads = 0

  leadsData?.forEach((lead) => {
    if (signedStatuses.includes(lead.status as string)) {
      totalSignedLeads++
      const refund = lead.refund_amount ?? 0
      const rate = (lead.commission_rate ?? 0) / 100
      expectedIncomeStatusBased += refund * rate
      if (lead.status === 'payment_completed') {
        amountCollectedStatusBased += refund * rate
      }
    }
  })

  return {
    totalLeadsInWindow,
    leadsWithEvents,
    eventCoverage,
    expectedIncomeStatusBased,
    amountCollectedStatusBased,
    totalSignedLeads,
  }
})

export async function getDataQualityStats(dateFrom?: string, dateTo?: string): Promise<DataQualityResult> {
  const authResult = await requireAuth()
  if (!authResult.authenticated) throw new Error(authResult.error)
  const dateFilter = (dateFrom || dateTo) ? { from: dateFrom, to: dateTo } : undefined
  return getDataQualityStatsInternal(dateFilter)
}

// ============ COHORT ANALYSIS (Phase 4) ============

export interface CohortRow {
  cohortMonth: string  // 'YYYY-MM'
  total: number
  follow_up: number
  warm: number
  signed: number
  exit: number
  future: number
  conversionRate: number
}

const getCohortAnalysisInternal = cache(async (): Promise<CohortRow[]> => {
  const supabase = await createClient()

  const { data } = await supabase
    .from(Tables.leads)
    .select('created_at, status')
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (!data || data.length === 0) return []

  const cohortMap = new Map<string, { total: number; stages: Record<PipelineStage, number> }>()

  data.forEach((lead) => {
    const month = new Date(lead.created_at!).toISOString().slice(0, 7) // 'YYYY-MM'
    const existing = cohortMap.get(month) ?? {
      total: 0,
      stages: { follow_up: 0, warm: 0, signed: 0, exit: 0, future: 0 },
    }
    existing.total++
    const stage = getPipelineStage(lead.status as string)
    if (stage) {
      existing.stages[stage]++
    }
    cohortMap.set(month, existing)
  })

  return Array.from(cohortMap.entries())
    .map(([cohortMonth, stats]) => ({
      cohortMonth,
      total: stats.total,
      follow_up: stats.stages.follow_up,
      warm: stats.stages.warm,
      signed: stats.stages.signed,
      exit: stats.stages.exit,
      future: stats.stages.future,
      conversionRate: stats.total > 0 ? (stats.stages.signed / stats.total) * 100 : 0,
    }))
    .sort((a, b) => a.cohortMonth.localeCompare(b.cohortMonth))
})

export async function getCohortAnalysis(): Promise<CohortRow[]> {
  const authResult = await requireAuth()
  if (!authResult.authenticated) throw new Error(authResult.error)
  return getCohortAnalysisInternal()
}

// ============ PIPELINE VELOCITY (Phase 4) ============

export interface VelocityMetric {
  label: string
  labelHe: string
  avgDays: number
  sampleSize: number
  isReliable: boolean  // sample >= 20
}

const getPipelineVelocityInternal = cache(async (): Promise<VelocityMetric[]> => {
  const supabase = await createClient()

  // Fetch all status_changed events ordered by lead and time
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: events } = await (supabase as any)
    .from(Tables.lead_events)
    .select('lead_id, old_value, new_value, created_at')
    .eq('event_type', 'status_changed')
    .order('created_at', { ascending: true })

  // Also fetch lead creation dates
  const { data: leads } = await supabase
    .from(Tables.leads)
    .select('id, created_at')
    .is('deleted_at', null)

  const creationMap = new Map<string, string>()
  leads?.forEach((lead) => {
    creationMap.set(lead.id, lead.created_at!)
  })

  type EventRecord = { lead_id: string; old_value: string; new_value: string; created_at: string }
  const typedEvents = (events as EventRecord[] || [])

  const signedStatuses = [...PIPELINE_STAGES.signed] as string[]
  const warmStatuses = [...PIPELINE_STAGES.warm] as string[]

  // Track first occurrence per lead for each transition type
  const firstContact = new Map<string, string>() // lead_id → timestamp of first warm/message_sent event
  const firstSigned = new Map<string, string>()   // lead_id → timestamp of first signed-stage event
  const firstPayment = new Map<string, string>()  // lead_id → timestamp of first payment_completed event

  typedEvents.forEach((event) => {
    const normNew = canonicaliseStatus(normaliseEventValue(event.new_value))

    // First contact: entering warm stage
    if (warmStatuses.includes(normNew) && !firstContact.has(event.lead_id)) {
      firstContact.set(event.lead_id, event.created_at)
    }
    // First signed
    if (signedStatuses.includes(normNew) && !firstSigned.has(event.lead_id)) {
      firstSigned.set(event.lead_id, event.created_at)
    }
    // First payment
    if (normNew === 'payment_completed' && !firstPayment.has(event.lead_id)) {
      firstPayment.set(event.lead_id, event.created_at)
    }
  })

  function calcAvgDays(pairs: [string, string][]): { avgDays: number; sampleSize: number } {
    if (pairs.length === 0) return { avgDays: 0, sampleSize: 0 }
    const totalDays = pairs.reduce((sum, [from, to]) => {
      const diff = (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)
      return sum + Math.max(0, diff)
    }, 0)
    return { avgDays: totalDays / pairs.length, sampleSize: pairs.length }
  }

  // 1. Creation → First contact
  const creationToContact: [string, string][] = []
  firstContact.forEach((contactDate, leadId) => {
    const created = creationMap.get(leadId)
    if (created) creationToContact.push([created, contactDate])
  })

  // 2. First contact → First signed
  const contactToSigned: [string, string][] = []
  firstSigned.forEach((signedDate, leadId) => {
    const contacted = firstContact.get(leadId)
    if (contacted) contactToSigned.push([contacted, signedDate])
  })

  // 3. First signed → First payment
  const signedToPayment: [string, string][] = []
  firstPayment.forEach((paymentDate, leadId) => {
    const signed = firstSigned.get(leadId)
    if (signed) signedToPayment.push([signed, paymentDate])
  })

  const v1 = calcAvgDays(creationToContact)
  const v2 = calcAvgDays(contactToSigned)
  const v3 = calcAvgDays(signedToPayment)

  return [
    {
      label: 'creation_to_contact',
      labelHe: 'יצירה → קשר ראשון',
      avgDays: Math.round(v1.avgDays * 10) / 10,
      sampleSize: v1.sampleSize,
      isReliable: v1.sampleSize >= 20,
    },
    {
      label: 'contact_to_signed',
      labelHe: 'קשר → חתימה',
      avgDays: Math.round(v2.avgDays * 10) / 10,
      sampleSize: v2.sampleSize,
      isReliable: v2.sampleSize >= 20,
    },
    {
      label: 'signed_to_payment',
      labelHe: 'חתימה → גבייה',
      avgDays: Math.round(v3.avgDays * 10) / 10,
      sampleSize: v3.sampleSize,
      isReliable: v3.sampleSize >= 20,
    },
  ]
})

export async function getPipelineVelocity(): Promise<VelocityMetric[]> {
  const authResult = await requireAuth()
  if (!authResult.authenticated) throw new Error(authResult.error)
  return getPipelineVelocityInternal()
}

// ============ DATA QUALITY HEALTH (Phase 4) ============

export interface DataQualityHealth {
  eventCoveragePercent: number     // % of leads with at least one status_changed event
  deprecatedStatusCount: number    // leads still on deprecated statuses
  revenueVisibilityPercent: number // % of signed-stage leads with refund_amount
  lastCheckTime: string            // ISO timestamp
}

const getDataQualityHealthInternal = cache(async (): Promise<DataQualityHealth> => {
  const supabase = await createClient()

  // All active leads
  const { data: allLeads } = await supabase
    .from(Tables.leads)
    .select('id, status, refund_amount')
    .is('deleted_at', null)

  // All leads with at least one status_changed event
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: eventLeads } = await (supabase as any)
    .from(Tables.lead_events)
    .select('lead_id')
    .eq('event_type', 'status_changed')

  const totalLeads = allLeads?.length || 0
  const uniqueEventLeadIds = new Set((eventLeads as { lead_id: string }[] || []).map(e => e.lead_id))
  const eventCoveragePercent = totalLeads > 0 ? (uniqueEventLeadIds.size / totalLeads) * 100 : 100

  // Deprecated status count
  const deprecatedStatuses = ['new', 'contacted', 'customer', 'completed', 'paying_customer']
  const deprecatedStatusCount = (allLeads || []).filter(l => deprecatedStatuses.includes(l.status as string)).length

  // Revenue visibility: signed-stage leads with refund_amount set
  const signedStatuses = [...PIPELINE_STAGES.signed] as string[]
  const signedLeads = (allLeads || []).filter(l => signedStatuses.includes(l.status as string))
  const signedWithRevenue = signedLeads.filter(l => l.refund_amount != null && l.refund_amount > 0)
  const revenueVisibilityPercent = signedLeads.length > 0
    ? (signedWithRevenue.length / signedLeads.length) * 100
    : 100

  return {
    eventCoveragePercent: Math.round(eventCoveragePercent * 10) / 10,
    deprecatedStatusCount,
    revenueVisibilityPercent: Math.round(revenueVisibilityPercent * 10) / 10,
    lastCheckTime: new Date().toISOString(),
  }
})

export async function getDataQualityHealth(): Promise<DataQualityHealth> {
  const authResult = await requireAuth()
  if (!authResult.authenticated) throw new Error(authResult.error)
  return getDataQualityHealthInternal()
}

// ============ ENHANCED SOURCE PERFORMANCE (Phase 4) ============

export interface EnhancedSourcePerformance extends SourcePerformance {
  collectionRate: number     // payment_completed / signed per source
  avgDaysToConvert: number   // avg days from creation to first signed event
}
