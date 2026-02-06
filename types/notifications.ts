// Notification types for the CRM notification center

export type NotificationType =
  | 'new_lead'
  | 'status_change'
  | 'note_added'
  | 'questionnaire_filled'
  | 'task_assigned'
  | 'task_due'

export type EntityType = 'lead' | 'questionnaire' | 'task'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  entity_type: EntityType | null
  entity_id: string | null
  is_read: boolean
  read_at: string | null
  created_at: string | null
  metadata: NotificationMetadata
  actor_user_id: string | null
}

export interface NotificationWithActor extends Notification {
  actor_display_name: string | null
  actor_email: string | null
}

export interface NotificationMetadata {
  lead_name?: string
  lead_id?: string
  old_status?: string
  new_status?: string
  note_preview?: string
  questionnaire_name?: string
  task_title?: string
  due_date?: string
  [key: string]: unknown
}

export interface CreateNotificationInput {
  user_id: string
  type: NotificationType
  title: string
  body?: string
  entity_type?: EntityType
  entity_id?: string
  metadata?: NotificationMetadata
  actor_user_id?: string
}

export interface NotificationFilterOptions {
  limit?: number
  offset?: number
  unreadOnly?: boolean
  actorUserId?: string
  type?: NotificationType
  dateFrom?: string
  dateTo?: string
  leadId?: string
}

export interface ActionResult<T = void> {
  success: boolean
  data?: T
  error?: string
}
