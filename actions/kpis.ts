'use server'

import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/tables'
import type { LeadKPIs, UTMPerformance, ConversionFunnelItem, TimeSeriesData } from '@/types/leads'

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

// Internal implementation functions wrapped with React.cache
const getLeadKPIsInternal = cache(async (): Promise<LeadKPIs> => {
  const supabase = await createClient()

  // Get counts by status
  const { data: statusCounts } = await supabase
    .from(Tables.leads)
    .select('status')
    .is('deleted_at', null)

  // Combined iteration: count statuses and track total in single pass
  const counts = {
    new: 0,
    contacted: 0,
    customer: 0,
    lost: 0,
  }
  let total = 0

  statusCounts?.forEach((lead) => {
    const status = lead.status as keyof typeof counts
    if (status in counts) {
      counts[status]++
      total++
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

  return {
    totalLeads: total,
    newLeads: counts.new,
    contactedLeads: counts.contacted,
    customers: counts.customer,
    lostLeads: counts.lost,
    conversionRate: total > 0 ? (counts.customer / total) * 100 : 0,
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

  // Combined iteration: count statuses and track total in single pass
  const counts: Record<string, number> = {
    new: 0,
    contacted: 0,
    customer: 0,
    lost: 0,
  }
  let total = 0

  data?.forEach((lead) => {
    if (lead.status && lead.status in counts) {
      counts[lead.status]++
      total++
    }
  })

  return [
    { stage: 'new', stageHe: 'חדש', count: counts.new, percentage: total ? (counts.new / total) * 100 : 0 },
    { stage: 'contacted', stageHe: 'נוצר קשר', count: counts.contacted, percentage: total ? (counts.contacted / total) * 100 : 0 },
    { stage: 'customer', stageHe: 'לקוח', count: counts.customer, percentage: total ? (counts.customer / total) * 100 : 0 },
    { stage: 'lost', stageHe: 'אבוד', count: counts.lost, percentage: total ? (counts.lost / total) * 100 : 0 },
  ]
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
  const dateMap = new Map<string, Record<string, number>>()

  data?.forEach((lead) => {
    const date = new Date(lead.created_at!).toISOString().split('T')[0]
    const existing = dateMap.get(date) ?? { new: 0, contacted: 0, customer: 0, lost: 0 }

    const status = lead.status as keyof typeof existing
    if (status in existing) {
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
    const counts = dateMap.get(dateStr)
    result.push({
      date: dateStr,
      new: counts?.new ?? 0,
      contacted: counts?.contacted ?? 0,
      customer: counts?.customer ?? 0,
      lost: counts?.lost ?? 0,
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
