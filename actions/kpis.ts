'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/tables'
import { LEAD_STATUSES, STATUS_CONFIG, PIPELINE_STAGES } from '@/types/leads'
import type { LeadKPIs, UTMPerformance, ConversionFunnelItem, TimeSeriesData, LeadStatus, PipelineStage } from '@/types/leads'

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
    hot: 0,
    signed: 0,
    lost: 0,
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

  // Calculate signed rate (customer + signed statuses)
  const signedCount = pipelineCounts.signed

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
    hotLeads: pipelineCounts.hot,
    signedLeads: pipelineCounts.signed,
    futureLeads: pipelineCounts.future,
    allLostLeads: pipelineCounts.lost,
    // Rates
    conversionRate: total > 0 ? (signedCount / total) * 100 : 0,
    totalPipelineValue: totalPipeline,
    weightedPipelineValue: weightedPipeline,
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
    hot: 'חמים מאוד',
    signed: 'סגירה',
    lost: 'אבודים',
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
  const relevantStages: PipelineStage[] = ['follow_up', 'warm', 'hot']

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
      contacted: counts.contacted ?? 0,
      message_sent: counts.message_sent ?? 0,
      meeting_set: counts.meeting_set ?? 0,
      pending_agreement: counts.pending_agreement ?? 0,
      signed: counts.signed ?? 0,
      under_review: counts.under_review ?? 0,
      report_submitted: counts.report_submitted ?? 0,
      missing_document: counts.missing_document ?? 0,
      completed: counts.completed ?? 0,
      not_relevant: counts.not_relevant ?? 0,
      closed_elsewhere: counts.closed_elsewhere ?? 0,
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
  converted: number  // leads that reached signed stage
}

const getDailyTrendsInternal = cache(async (days: number = 30, dateFilter?: DateFilter): Promise<DailyTrend[]> => {
  const supabase = await createClient()

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  let query = supabase
    .from(Tables.leads)
    .select('created_at, status')
    .is('deleted_at', null)
    .gte('created_at', dateFilter?.from || startDate.toISOString())

  if (dateFilter?.to) {
    query = query.lte('created_at', dateFilter.to)
  }

  const { data } = await query

  const signedStatuses = PIPELINE_STAGES.signed as readonly string[]
  const dateMap = new Map<string, { total: number; converted: number }>()

  data?.forEach((lead) => {
    const date = new Date(lead.created_at!).toISOString().split('T')[0]
    const existing = dateMap.get(date) ?? { total: 0, converted: 0 }
    existing.total++
    if (signedStatuses.includes(lead.status as string)) {
      existing.converted++
    }
    dateMap.set(date, existing)
  })

  // Fill missing dates
  const result: DailyTrend[] = []
  const current = new Date(dateFilter?.from || startDate)
  const end = dateFilter?.to ? new Date(dateFilter.to) : new Date()

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    const counts = dateMap.get(dateStr) ?? { total: 0, converted: 0 }
    result.push({ date: dateStr, ...counts })
    current.setDate(current.getDate() + 1)
  }

  return result
})

export async function getDailyTrends(days: number = 30, dateFrom?: string, dateTo?: string): Promise<DailyTrend[]> {
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

const getSourcePerformanceInternal = cache(async (dateFilter?: DateFilter): Promise<SourcePerformance[]> => {
  const supabase = await createClient()

  let query = supabase
    .from(Tables.leads)
    .select('utm_source, source, status, expected_revenue')
    .is('deleted_at', null)

  if (dateFilter?.from) query = query.gte('created_at', dateFilter.from)
  if (dateFilter?.to) query = query.lte('created_at', dateFilter.to)

  const { data } = await query

  const signedStatuses = PIPELINE_STAGES.signed as readonly string[]
  const sourceMap = new Map<string, { leads: number; converted: number; revenue: number }>()

  data?.forEach((lead) => {
    const src = lead.utm_source || lead.source || 'ישיר'
    const existing = sourceMap.get(src) ?? { leads: 0, converted: 0, revenue: 0 }
    existing.leads++
    if (signedStatuses.includes(lead.status as string)) {
      existing.converted++
      existing.revenue += lead.expected_revenue ?? 0
    }
    sourceMap.set(src, existing)
  })

  return Array.from(sourceMap.entries())
    .map(([source, stats]) => ({
      source,
      leads: stats.leads,
      converted: stats.converted,
      conversionRate: stats.leads > 0 ? (stats.converted / stats.leads) * 100 : 0,
      revenue: stats.revenue,
      avgDealSize: stats.converted > 0 ? stats.revenue / stats.converted : 0,
    }))
    .sort((a, b) => b.leads - a.leads)
})

export async function getSourcePerformance(dateFrom?: string, dateTo?: string): Promise<SourcePerformance[]> {
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
    .select('utm_campaign, status, expected_revenue')
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
      existing.revenue += lead.expected_revenue ?? 0
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

  let query = supabase
    .from(Tables.leads)
    .select('status, expected_revenue')
    .is('deleted_at', null)

  if (dateFilter?.from) query = query.gte('created_at', dateFilter.from)
  if (dateFilter?.to) query = query.lte('created_at', dateFilter.to)

  const { data } = await query

  const stageLabels: Record<PipelineStage, string> = {
    follow_up: 'מעקב',
    warm: 'חמים',
    hot: 'חמים מאוד',
    signed: 'סגירה',
    lost: 'אבודים',
    future: 'עתידי',
  }

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
