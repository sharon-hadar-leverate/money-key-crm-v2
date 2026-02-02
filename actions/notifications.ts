'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/tables'
import type {
  Notification,
  CreateNotificationInput,
  ActionResult,
  NotificationMetadata,
} from '@/types/notifications'
import type { Json } from '@/types/database'

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
): Promise<Notification[]> {
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

    return (data ?? []).map(mapNotification)
  } catch {
    return []
  }
}

export async function getAllNotifications(
  options?: {
    limit?: number
    offset?: number
    unreadOnly?: boolean
  }
): Promise<{ notifications: Notification[]; total: number }> {
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

  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Failed to get notifications:', error)
    return { notifications: [], total: 0 }
  }

  return {
    notifications: (data ?? []).map(mapNotification),
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
  }
}
