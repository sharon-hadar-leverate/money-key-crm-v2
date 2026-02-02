// Task types for the manual task system

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Task {
  id: string
  title: string
  description: string | null
  created_by: string
  assigned_to: string | null
  lead_id: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  completed_at: string | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}

export interface TaskWithLead extends Task {
  lead_name?: string
}

export interface CreateTaskInput {
  title: string
  description?: string
  assigned_to?: string
  lead_id?: string
  priority?: TaskPriority
  due_date?: string
}

export interface UpdateTaskInput {
  id: string
  title?: string
  description?: string
  assigned_to?: string | null
  lead_id?: string | null
  status?: TaskStatus
  priority?: TaskPriority
  due_date?: string | null
}

export interface TaskFilterOptions {
  status?: TaskStatus
  statuses?: TaskStatus[]
  assigned_to?: string
  lead_id?: string
  priority?: TaskPriority
  due_before?: string
  due_after?: string
  includeDeleted?: boolean
  limit?: number
  offset?: number
}

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}
