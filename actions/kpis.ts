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

// Internal implementation functions wrapped with React.cache
const getLeadKPIsInternal = cache(async (): Promise<LeadKPIs> => {
  const supabase = await createClient()

  // Get counts by status
  const { data: statusCounts } = await supabase
    .from(Tables.leads)
    .select('status')
    .is('deleted_at', null)

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

  // Get pipeline values
  const { data: pipelineData } = await supabase
    .from(Tables.leads)
    .select('expected_revenue, probability')
    .is('deleted_at', null)
    .not('expected_revenue', 'is', null)

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

const getConversionFunnelInternal = cache(async (): Promise<ConversionFunnelItem[]> => {
  const supabase = await createClient()

  const { data } = await supabase
    .from(Tables.leads)
    .select('status')
    .is('deleted_at', null)

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

const getUTMPerformanceInternal = cache(async (): Promise<UTMPerformance[]> => {
  const supabase = await createClient()

  const { data } = await supabase
    .from(Tables.leads)
    .select('utm_source, status, expected_revenue')
    .is('deleted_at', null)
    .not('utm_source', 'is', null)

  const performanceMap = new Map<string, {
    leadCount: number
    customerCount: number
    totalRevenue: number
  }>()

  data?.forEach((lead) => {
    const source = lead.utm_source ?? 'direct'
    const existing = performanceMap.get(source) ?? {
      leadCount: 0,
      customerCount: 0,
      totalRevenue: 0,
    }

    existing.leadCount++
    if (lead.status === 'customer') {
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
      // Original statuses
      new: counts.new ?? 0,
      contacted: counts.contacted ?? 0,
      customer: counts.customer ?? 0,
      lost: counts.lost ?? 0,
      // Zoho statuses
      signed: counts.signed ?? 0,
      meeting_set: counts.meeting_set ?? 0,
      pending_agreement: counts.pending_agreement ?? 0,
      message_sent: counts.message_sent ?? 0,
      no_answer: counts.no_answer ?? 0,
      not_contacted: counts.not_contacted ?? 0,
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
export async function getLeadKPIs(): Promise<LeadKPIs> {
  const authResult = await requireAuth()
  if (!authResult.authenticated) {
    throw new Error(authResult.error)
  }
  return getLeadKPIsInternal()
}

export async function getConversionFunnel(): Promise<ConversionFunnelItem[]> {
  const authResult = await requireAuth()
  if (!authResult.authenticated) {
    throw new Error(authResult.error)
  }
  return getConversionFunnelInternal()
}

export async function getUTMPerformance(): Promise<UTMPerformance[]> {
  const authResult = await requireAuth()
  if (!authResult.authenticated) {
    throw new Error(authResult.error)
  }
  return getUTMPerformanceInternal()
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
