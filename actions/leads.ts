'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/tables'
import type {
  Lead,
  LeadEvent,
  CreateLeadInput,
  UpdateLeadInput,
  LeadStatus,
  LeadFilterOptions,
} from '@/types/leads'

// Helper to get current user email for audit trail
async function getCurrentUserEmail(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email ?? null
}

// ============ CREATE ============
export async function createLead(input: CreateLeadInput): Promise<{
  success: boolean
  data?: Lead
  error?: string
}> {
  try {
    const supabase = await createClient()
    const userEmail = await getCurrentUserEmail()

    const { data, error } = await supabase
      .from(Tables.leads)
      .insert({
        name: input.name,
        email: input.email,
        phone: input.phone,
        first_name: input.first_name,
        last_name: input.last_name,
        source: input.source,
        expected_revenue: input.expected_revenue,
        probability: input.probability,
        custom_fields: input.custom_fields ?? {},
        utm_source: input.utm_source,
        utm_medium: input.utm_medium,
        utm_campaign: input.utm_campaign,
        utm_content: input.utm_content,
        utm_term: input.utm_term,
        gclid: input.gclid,
        landing_page: input.landing_page,
        referrer: input.referrer,
        ip_address: input.ip_address,
        user_agent: input.user_agent,
        status: 'new',
        is_new: true,
      })
      .select()
      .single()

    if (error) throw error

    // Log creation event
    await supabase.from(Tables.lead_events).insert({
      lead_id: data.id,
      event_type: 'created',
      user_email: userEmail,
      new_value: input.name,
      metadata: {
        source: input.source,
        utm_source: input.utm_source,
      },
    })

    revalidatePath('/leads')
    revalidatePath('/dashboard')

    return { success: true, data }
  } catch (error) {
    console.error('Failed to create lead:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create lead',
    }
  }
}

// ============ READ ============
export async function getLeads(options?: LeadFilterOptions): Promise<{
  data: Lead[]
  count: number
}> {
  const supabase = await createClient()

  let query = supabase
    .from(Tables.leads)
    .select('*', { count: 'exact' })

  // Filter soft-deleted by default
  if (!options?.includeDeleted) {
    query = query.is('deleted_at', null)
  }

  // Status filter (single or multiple)
  if (options?.statuses && options.statuses.length > 0) {
    query = query.in('status', options.statuses)
  } else if (options?.status) {
    query = query.eq('status', options.status)
  }

  // UTM source filter
  if (options?.utmSource) {
    query = query.eq('utm_source', options.utmSource)
  }

  // Date range filter
  if (options?.dateFrom) {
    query = query.gte('created_at', options.dateFrom)
  }
  if (options?.dateTo) {
    query = query.lte('created_at', options.dateTo)
  }

  // Search across name, email, phone
  if (options?.search) {
    query = query.or(
      `name.ilike.%${options.search}%,email.ilike.%${options.search}%,phone.ilike.%${options.search}%`
    )
  }

  // Ordering
  const orderBy = options?.orderBy ?? 'created_at'
  const orderDirection = options?.orderDirection ?? 'desc'
  query = query.order(orderBy, { ascending: orderDirection === 'asc' })

  // Pagination
  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Failed to fetch leads:', error)
    return { data: [], count: 0 }
  }

  return { data: data ?? [], count: count ?? 0 }
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(Tables.leads)
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Failed to fetch lead:', error)
    return null
  }

  return data
}

export async function getLeadWithEvents(id: string): Promise<{
  lead: Lead
  events: LeadEvent[]
} | null> {
  const supabase = await createClient()

  const [leadResult, eventsResult] = await Promise.all([
    supabase.from(Tables.leads).select('*').eq('id', id).single(),
    supabase
      .from(Tables.lead_events)
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (leadResult.error || !leadResult.data) {
    return null
  }

  return {
    lead: leadResult.data,
    events: eventsResult.data ?? [],
  }
}

// ============ UPDATE ============
export async function updateLead(input: UpdateLeadInput): Promise<{
  success: boolean
  data?: Lead
  error?: string
}> {
  try {
    const supabase = await createClient()
    const userEmail = await getCurrentUserEmail()

    // Get current lead for comparison
    const { data: currentLead } = await supabase
      .from(Tables.leads)
      .select('*')
      .eq('id', input.id)
      .single()

    if (!currentLead) {
      return { success: false, error: 'Lead not found' }
    }

    // Build update object
    const updates: Record<string, unknown> = {}
    const changedFields: { field: string; oldValue: unknown; newValue: unknown }[] = []

    const fieldsToCheck: (keyof UpdateLeadInput)[] = [
      'name', 'email', 'phone', 'first_name', 'last_name',
      'status', 'expected_revenue', 'probability', 'is_new'
    ]

    for (const field of fieldsToCheck) {
      if (input[field] !== undefined && input[field] !== currentLead[field as keyof Lead]) {
        updates[field] = input[field]
        changedFields.push({
          field,
          oldValue: currentLead[field as keyof Lead],
          newValue: input[field],
        })
      }
    }

    // Handle custom_fields merge
    if (input.custom_fields) {
      const mergedFields = {
        ...(currentLead.custom_fields as object ?? {}),
        ...input.custom_fields,
      }
      updates.custom_fields = mergedFields
    }

    if (Object.keys(updates).length === 0) {
      return { success: true, data: currentLead }
    }

    // Perform update
    const { data, error } = await supabase
      .from(Tables.leads)
      .update(updates)
      .eq('id', input.id)
      .select()
      .single()

    if (error) throw error

    // Log field-level changes
    for (const change of changedFields) {
      await supabase.from(Tables.lead_events).insert({
        lead_id: input.id,
        event_type: change.field === 'status' ? 'status_changed' : 'field_changed',
        field_name: change.field,
        old_value: String(change.oldValue ?? ''),
        new_value: String(change.newValue ?? ''),
        user_email: userEmail,
      })
    }

    revalidatePath('/leads')
    revalidatePath(`/leads/${input.id}`)
    revalidatePath('/dashboard')

    return { success: true, data }
  } catch (error) {
    console.error('Failed to update lead:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update lead',
    }
  }
}

// ============ STATUS TRANSITIONS ============
export async function updateLeadStatus(
  id: string,
  newStatus: LeadStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const userEmail = await getCurrentUserEmail()

    // Get current status
    const { data: lead } = await supabase
      .from(Tables.leads)
      .select('status')
      .eq('id', id)
      .single()

    if (!lead) {
      return { success: false, error: 'Lead not found' }
    }

    const oldStatus = lead.status

    // Update status
    const { error: updateError } = await supabase
      .from(Tables.leads)
      .update({
        status: newStatus,
        is_new: newStatus === 'new',
      })
      .eq('id', id)

    if (updateError) throw updateError

    // Log status change event
    await supabase.from(Tables.lead_events).insert({
      lead_id: id,
      event_type: 'status_changed',
      field_name: 'status',
      old_value: oldStatus,
      new_value: newStatus,
      user_email: userEmail,
    })

    revalidatePath('/leads')
    revalidatePath(`/leads/${id}`)
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Failed to update lead status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    }
  }
}

// ============ SOFT DELETE / RESTORE ============
export async function softDeleteLead(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const userEmail = await getCurrentUserEmail()

    const { error } = await supabase
      .from(Tables.leads)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) throw error

    // Log delete event
    await supabase.from(Tables.lead_events).insert({
      lead_id: id,
      event_type: 'deleted',
      user_email: userEmail,
    })

    revalidatePath('/leads')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Failed to delete lead:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete lead',
    }
  }
}

export async function restoreLead(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const userEmail = await getCurrentUserEmail()

    const { error } = await supabase
      .from(Tables.leads)
      .update({ deleted_at: null })
      .eq('id', id)

    if (error) throw error

    // Log restore event
    await supabase.from(Tables.lead_events).insert({
      lead_id: id,
      event_type: 'restored',
      user_email: userEmail,
    })

    revalidatePath('/leads')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Failed to restore lead:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to restore lead',
    }
  }
}

// ============ MARK AS SEEN ============
export async function markLeadAsSeen(id: string): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from(Tables.leads)
    .update({
      is_new: false,
      last_seen: new Date().toISOString(),
    })
    .eq('id', id)

  revalidatePath('/leads')
}
