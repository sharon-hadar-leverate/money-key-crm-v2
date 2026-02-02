'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/tables'
import { createNotification } from './notifications'
import type {
  Task,
  TaskWithLead,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilterOptions,
  ActionResult,
  TaskStatus,
} from '@/types/tasks'

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
// CREATE TASK
// ============================================

export async function createTask(
  input: CreateTaskInput
): Promise<ActionResult<Task>> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'User not authenticated' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from(Tables.tasks)
      .insert({
        title: input.title,
        description: input.description,
        created_by: userId,
        assigned_to: input.assigned_to ?? userId,
        lead_id: input.lead_id,
        priority: input.priority ?? 'normal',
        due_date: input.due_date,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    // Send notification if assigned to someone else
    if (input.assigned_to && input.assigned_to !== userId) {
      await createNotification({
        user_id: input.assigned_to,
        type: 'task_assigned',
        title: `משימה חדשה: ${input.title}`,
        body: input.description,
        entity_type: 'task',
        entity_id: data.id,
        metadata: {
          task_title: input.title,
          due_date: input.due_date,
        },
      })
    }

    revalidatePath('/tasks')

    return { success: true, data: mapTask(data) }
  } catch (error) {
    console.error('Failed to create task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task',
    }
  }
}

// ============================================
// READ TASKS
// ============================================

export async function getTasks(
  options?: TaskFilterOptions
): Promise<{ tasks: Task[]; total: number }> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from(Tables.tasks)
      .select('*', { count: 'exact' })

    // Filter soft-deleted by default
    if (!options?.includeDeleted) {
      query = query.is('deleted_at', null)
    }

    // Status filter
    if (options?.statuses && options.statuses.length > 0) {
      query = query.in('status', options.statuses)
    } else if (options?.status) {
      query = query.eq('status', options.status)
    }

    // Assigned to filter
    if (options?.assigned_to) {
      query = query.eq('assigned_to', options.assigned_to)
    }

    // Lead filter
    if (options?.lead_id) {
      query = query.eq('lead_id', options.lead_id)
    }

    // Priority filter
    if (options?.priority) {
      query = query.eq('priority', options.priority)
    }

    // Due date filters
    if (options?.due_before) {
      query = query.lte('due_date', options.due_before)
    }
    if (options?.due_after) {
      query = query.gte('due_date', options.due_after)
    }

    // Ordering: pending tasks first, then by due date
    query = query
      .order('status', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    // Pagination
    const limit = options?.limit ?? 50
    const offset = options?.offset ?? 0
    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await query

    if (error) {
      // Table might not exist yet - silently return empty
      // Don't log error to avoid console noise when tables aren't created
      if (process.env.NODE_ENV === 'development') {
        console.warn('Tasks: Could not fetch (table may not exist). Run migration 014_create_tasks.sql')
      }
      return { tasks: [], total: 0 }
    }

    return {
      tasks: (data ?? []).map(mapTask),
      total: count ?? 0,
    }
  } catch {
    // Silently return empty - table may not exist
    return { tasks: [], total: 0 }
  }
}

export async function getMyTasks(
  options?: Omit<TaskFilterOptions, 'assigned_to'>
): Promise<{ tasks: Task[]; total: number }> {
  const userId = await getCurrentUserId()
  if (!userId) return { tasks: [], total: 0 }

  return getTasks({ ...options, assigned_to: userId })
}

export async function getPendingTasks(): Promise<Task[]> {
  const userId = await getCurrentUserId()
  if (!userId) return []

  const { tasks } = await getTasks({
    assigned_to: userId,
    statuses: ['pending', 'in_progress'],
    limit: 100,
  })

  return tasks
}

export async function getTaskById(id: string): Promise<Task | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(Tables.tasks)
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Failed to fetch task:', error)
    return null
  }

  return mapTask(data)
}

export async function getTasksForLead(leadId: string): Promise<Task[]> {
  const { tasks } = await getTasks({ lead_id: leadId })
  return tasks
}

// ============================================
// UPDATE TASK
// ============================================

export async function updateTask(
  input: UpdateTaskInput
): Promise<ActionResult<Task>> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'User not authenticated' }
    }

    const supabase = await createClient()

    // Get current task for comparison
    const { data: currentTask } = await supabase
      .from(Tables.tasks)
      .select('*')
      .eq('id', input.id)
      .single()

    if (!currentTask) {
      return { success: false, error: 'Task not found' }
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (input.title !== undefined) updates.title = input.title
    if (input.description !== undefined) updates.description = input.description
    if (input.assigned_to !== undefined) updates.assigned_to = input.assigned_to
    if (input.lead_id !== undefined) updates.lead_id = input.lead_id
    if (input.status !== undefined) {
      updates.status = input.status
      if (input.status === 'completed') {
        updates.completed_at = new Date().toISOString()
      }
    }
    if (input.priority !== undefined) updates.priority = input.priority
    if (input.due_date !== undefined) updates.due_date = input.due_date

    const { data, error } = await supabase
      .from(Tables.tasks)
      .update(updates)
      .eq('id', input.id)
      .select()
      .single()

    if (error) throw error

    // Notify if assigned to someone new
    if (
      input.assigned_to &&
      input.assigned_to !== currentTask.assigned_to &&
      input.assigned_to !== userId
    ) {
      await createNotification({
        user_id: input.assigned_to,
        type: 'task_assigned',
        title: `משימה חדשה: ${data.title}`,
        body: data.description ?? undefined,
        entity_type: 'task',
        entity_id: data.id,
        metadata: {
          task_title: data.title,
          due_date: data.due_date ?? undefined,
        },
      })
    }

    revalidatePath('/tasks')
    if (data.lead_id) {
      revalidatePath(`/leads/${data.lead_id}`)
    }

    return { success: true, data: mapTask(data) }
  } catch (error) {
    console.error('Failed to update task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update task',
    }
  }
}

export async function completeTask(id: string): Promise<ActionResult<Task>> {
  return updateTask({ id, status: 'completed' })
}

export async function cancelTask(id: string): Promise<ActionResult<Task>> {
  return updateTask({ id, status: 'cancelled' })
}

// ============================================
// DELETE TASK
// ============================================

export async function deleteTask(id: string): Promise<ActionResult> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { success: false, error: 'User not authenticated' }
    }

    const supabase = await createClient()

    // Soft delete
    const { error } = await supabase
      .from(Tables.tasks)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/tasks')

    return { success: true }
  } catch (error) {
    console.error('Failed to delete task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete task',
    }
  }
}

// ============================================
// STATS
// ============================================

export async function getTaskStats(): Promise<{
  pending: number
  in_progress: number
  completed_today: number
  overdue: number
}> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return { pending: 0, in_progress: 0, completed_today: 0, overdue: 0 }
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const [pendingRes, inProgressRes, completedTodayRes, overdueRes] = await Promise.all([
    supabase
      .from(Tables.tasks)
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', userId)
      .eq('status', 'pending')
      .is('deleted_at', null),
    supabase
      .from(Tables.tasks)
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', userId)
      .eq('status', 'in_progress')
      .is('deleted_at', null),
    supabase
      .from(Tables.tasks)
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', userId)
      .eq('status', 'completed')
      .gte('completed_at', today)
      .is('deleted_at', null),
    supabase
      .from(Tables.tasks)
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', userId)
      .eq('status', 'pending')
      .lt('due_date', today)
      .is('deleted_at', null),
  ])

  return {
    pending: pendingRes.count ?? 0,
    in_progress: inProgressRes.count ?? 0,
    completed_today: completedTodayRes.count ?? 0,
    overdue: overdueRes.count ?? 0,
  }
}

// ============================================
// MAPPER
// ============================================

function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    created_by: row.created_by as string,
    assigned_to: (row.assigned_to as string | null) ?? null,
    lead_id: (row.lead_id as string | null) ?? null,
    status: row.status as Task['status'],
    priority: row.priority as Task['priority'],
    due_date: (row.due_date as string | null) ?? null,
    completed_at: (row.completed_at as string | null) ?? null,
    created_at: (row.created_at as string | null) ?? null,
    updated_at: (row.updated_at as string | null) ?? null,
    deleted_at: (row.deleted_at as string | null) ?? null,
  }
}
