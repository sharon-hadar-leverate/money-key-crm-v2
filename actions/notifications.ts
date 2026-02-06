'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/tables'
import type {
  Notification,
  NotificationWithActor,
  CreateNotificationInput,
  ActionResult,
  NotificationMetadata,
  NotificationFilterOptions,
} from '@/types/notifications'
import type { Json } from '@/types/database'
import { getUserProfiles } from './user-profile'

// Helper to get current user ID
async function getCurrentUserId(): Promise<string | null> {
  if (process.env.BYPASS_AUTH === 'true') {
    return '00000000-0000-0000-0000-000000000000'
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

// ============================================
// GET NOTIFICATIONS
// ============================================

export async function getUnreadCount(): Promise<number> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return 0

    const supabase = await createClient()

    const { count, error } = await supabase
      .from(Tables.notifications)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      // Silently return 0 - table may not exist yet
      return 0
    }

    return count ?? 0
  } catch {
    return 0
  }
}

export async function getRecentNotifications(
  limit: number = 10
): Promise<NotificationWithActor[]> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return []

    const supabase = await createClient()

    const { data, error } = await supabase
      .from(Tables.notifications)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      // Silently return empty - table may not exist yet
      return []
    }

    const notifications = (data ?? []).map(mapNotification)
    return resolveActorProfiles(notifications)
  } catch {
    return []
  }
}

export async function getAllNotifications(
  options?: NotificationFilterOptions
): Promise<{ notifications: NotificationWithActor[]; total: number }> {
  const userId = await getCurrentUserId()
  if (!userId) return { notifications: [], total: 0 }

  const supabase = await createClient()

  let query = supabase
    .from(Tables.notifications)
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (options?.unreadOnly) {
    query = query.eq('is_read', false)
  }

  if (options?.actorUserId) {
    query = query.eq('actor_user_id', options.actorUserId)
  }

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.dateFrom) {
    query = query.gte('created_at', options.dateFrom)
  }

  if (options?.dateTo) {
    query = query.lte('created_at', options.dateTo)
  }

  if (options?.leadId) {
    query = query.eq('entity_id', options.leadId).eq('entity_type', 'lead')
  }

  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Failed to get notifications:', error)
    return { notifications: [], total: 0 }
  }

  const notifications = (data ?? []).map(mapNotification)
  return {
    notifications: await resolveActorProfiles(notifications),
    total: count ?? 0,
  }
}

// ============================================
// UPDATE NOTIFICATIONS
// ============================================

export async function markAsRead(
  notificationId: string
): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'User not authenticated' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from(Tables.notifications)
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) throw error

    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('Failed to mark notification as read:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark as read',
    }
  }
}

export async function markAllAsRead(): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'User not authenticated' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from(Tables.notifications)
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error

    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error('Failed to mark all as read:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark all as read',
    }
  }
}

// ============================================
// FILTER DATA
// ============================================

export async function getDistinctActors(): Promise<
  { user_id: string; display_name: string }[]
> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return []

    const supabase = await createClient()

    const { data, error } = await supabase
      .from(Tables.notifications)
      .select('actor_user_id')
      .eq('user_id', userId)
      .not('actor_user_id', 'is', null)

    if (error || !data) return []

    const uniqueIds = Array.from(new Set(data.map(r => r.actor_user_id as string)))
    if (uniqueIds.length === 0) return []

    const profilesMap = await getUserProfiles(uniqueIds)

    return uniqueIds
      .map(id => {
        const profile = profilesMap.get(id)
        return {
          user_id: id,
          display_name: profile?.display_name ?? 'Unknown',
        }
      })
      .sort((a, b) => a.display_name.localeCompare(b.display_name))
  } catch {
    return []
  }
}

export async function getDistinctNotificationLeads(): Promise<
  { lead_id: string; lead_name: string }[]
> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) return []

    const supabase = await createClient()

    const { data, error } = await supabase
      .from(Tables.notifications)
      .select('entity_id, metadata')
      .eq('user_id', userId)
      .eq('entity_type', 'lead')
      .not('entity_id', 'is', null)

    if (error || !data) return []

    const leadsMap = new Map<string, string>()
    for (const row of data) {
      const leadId = row.entity_id as string
      if (!leadsMap.has(leadId)) {
        const meta = (row.metadata as NotificationMetadata) ?? {}
        leadsMap.set(leadId, meta.lead_name ?? leadId)
      }
    }

    return Array.from(leadsMap.entries())
      .map(([lead_id, lead_name]) => ({ lead_id, lead_name }))
      .sort((a, b) => a.lead_name.localeCompare(b.lead_name))
  } catch {
    return []
  }
}

// ============================================
// CREATE NOTIFICATION
// ============================================

export async function createNotification(
  input: CreateNotificationInput
): Promise<ActionResult<Notification>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from(Tables.notifications)
      .insert({
        user_id: input.user_id,
        type: input.type,
        title: input.title,
        body: input.body,
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        metadata: (input.metadata ?? {}) as unknown as Json,
        actor_user_id: input.actor_user_id,
      })
      .select()
      .single()

    if (error) {
      // Table might not exist yet - silently succeed
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Notifications table does not exist yet. Run the migration.')
        return { success: true }
      }
      throw error
    }

    return { success: true, data: mapNotification(data) }
  } catch (error) {
    console.error('Failed to create notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create notification',
    }
  }
}

// Helper to create notifications for all users (for system-wide notifications)
export async function createNotificationForAllUsers(
  input: Omit<CreateNotificationInput, 'user_id'>
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from(Tables.user_profiles)
      .select('user_id')

    if (profilesError) {
      // Table might not exist yet - silently succeed
      if (profilesError.code === '42P01' || profilesError.message?.includes('does not exist')) {
        return { success: true }
      }
      throw profilesError
    }

    if (!profiles || profiles.length === 0) {
      return { success: true } // No users to notify
    }

    // Create notifications for each user
    const notifications = profiles.map(p => ({
      user_id: p.user_id,
      type: input.type,
      title: input.title,
      body: input.body,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      metadata: (input.metadata ?? {}) as unknown as Json,
      actor_user_id: input.actor_user_id,
    }))

    const { error } = await supabase
      .from(Tables.notifications)
      .insert(notifications)

    if (error) {
      // Table might not exist yet - silently succeed
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Notifications table does not exist yet. Run the migration.')
        return { success: true }
      }
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Failed to create notifications for all users:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create notifications',
    }
  }
}

// ============================================
// MAPPER
// ============================================

function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    type: row.type as Notification['type'],
    title: row.title as string,
    body: row.body as string | null,
    entity_type: row.entity_type as Notification['entity_type'],
    entity_id: row.entity_id as string | null,
    is_read: row.is_read as boolean,
    read_at: row.read_at as string | null,
    created_at: row.created_at as string | null,
    metadata: (row.metadata as NotificationMetadata) ?? {},
    actor_user_id: (row.actor_user_id as string | null) ?? null,
  }
}

async function resolveActorProfiles(
  notifications: Notification[]
): Promise<NotificationWithActor[]> {
  const actorIds = Array.from(
    new Set(notifications.map(n => n.actor_user_id).filter((id): id is string => id !== null))
  )

  const profilesMap = await getUserProfiles(actorIds)

  return notifications.map(n => {
    const profile = n.actor_user_id ? profilesMap.get(n.actor_user_id) : null
    return {
      ...n,
      actor_display_name: profile?.display_name ?? null,
      actor_email: profile?.email ?? null,
    }
  })
}
