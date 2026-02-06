'use client'

import { memo } from 'react'
import Link from 'next/link'
import { cn, getInitials, formatDateTime } from '@/lib/utils'
import {
  UserPlus,
  ArrowLeftRight,
  MessageSquare,
  ClipboardCheck,
  CheckSquare,
  Bell,
  ArrowLeft,
  Clock,
} from 'lucide-react'
import { StatusBadge } from '@/components/leads/status-badge'
import { isPast, isToday, isTomorrow, format, parseISO } from 'date-fns'
import type { NotificationWithActor } from '@/types/notifications'

interface NotificationItemProps {
  notification: NotificationWithActor
  onMarkAsRead?: (id: string) => void
  compact?: boolean
}

const typeIcons = {
  new_lead: UserPlus,
  status_change: ArrowLeftRight,
  note_added: MessageSquare,
  questionnaire_filled: ClipboardCheck,
  task_assigned: CheckSquare,
  task_due: Bell,
}

const typeColors = {
  new_lead: 'text-[#00A0B0] bg-[#E5F6F7]',
  status_change: 'text-[#FDAB3D] bg-[#FFF3CD]',
  note_added: 'text-[#9D67E5] bg-[#F3E8FF]',
  questionnaire_filled: 'text-[#00854D] bg-[#D4F4DD]',
  task_assigned: 'text-[#0073EA] bg-[#E0EFFF]',
  task_due: 'text-[#D83A52] bg-[#FFE5E5]',
}

function isDueDatePast(dateStr: string): boolean {
  try {
    const date = parseISO(dateStr)
    return isPast(date) && !isToday(date)
  } catch {
    return false
  }
}

function formatDueDateShort(dateStr: string): string {
  try {
    const date = parseISO(dateStr)
    if (isToday(date)) return 'היום'
    if (isTomorrow(date)) return 'מחר'
    return format(date, 'dd/MM')
  } catch {
    return dateStr
  }
}

function NotificationTypeContent({
  notification,
  compact,
}: {
  notification: NotificationWithActor
  compact: boolean
}) {
  const meta = notification.metadata

  switch (notification.type) {
    case 'status_change': {
      if (meta?.old_status && meta?.new_status) {
        return (
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <StatusBadge status={meta.old_status} size="sm" />
            <ArrowLeft className="h-3 w-3 text-[#9B9BAD] shrink-0" />
            <StatusBadge status={meta.new_status} size="sm" />
          </div>
        )
      }
      break
    }

    case 'note_added': {
      const preview = meta?.note_preview ?? notification.body
      if (preview) {
        return (
          <p
            className={cn(
              'text-xs text-[#676879] mt-0.5 border-r-2 border-[#9D67E5] pr-2',
              compact ? 'line-clamp-1' : 'line-clamp-2'
            )}
          >
            {preview}
          </p>
        )
      }
      break
    }

    case 'task_assigned': {
      const dueDate = meta?.due_date
      return (
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {dueDate && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium',
                isDueDatePast(dueDate)
                  ? 'bg-[#FFE5E5] text-[#D83A52]'
                  : 'bg-[#E0EFFF] text-[#0073EA]'
              )}
            >
              <Clock className="h-3 w-3" />
              {formatDueDateShort(dueDate)}
            </span>
          )}
          {!compact && notification.body && (
            <p className="text-xs text-[#676879] line-clamp-1">
              {notification.body}
            </p>
          )}
        </div>
      )
    }

    case 'new_lead': {
      const source =
        (meta?.source as string) ??
        notification.body?.match(/מקור:\s*(.+)/)?.[1]
      if (source) {
        return (
          <div className="mt-0.5">
            <span className="inline-block px-2 py-0.5 rounded bg-[#F5F6F8] text-xs text-[#676879]">
              {source}
            </span>
          </div>
        )
      }
      break
    }

    case 'questionnaire_filled': {
      const name = meta?.questionnaire_name
      if (name) {
        return (
          <div className="mt-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#D4F4DD] text-xs text-[#00854D]">
              <ClipboardCheck className="h-3 w-3" />
              {name}
            </span>
          </div>
        )
      }
      break
    }
  }

  // Default fallback: plain body text
  if (notification.body) {
    return (
      <p className="text-xs text-[#9B9BAD] mt-0.5 line-clamp-2">
        {notification.body}
      </p>
    )
  }

  return null
}

function getNotificationHref(notification: NotificationWithActor): string | null {
  if (!notification.entity_type || !notification.entity_id) {
    return null
  }

  switch (notification.entity_type) {
    case 'lead':
      return `/leads/${notification.entity_id}`
    case 'task':
      return '/tasks'
    case 'questionnaire':
      return '/tasks'
    default:
      return null
  }
}

export const NotificationItem = memo(function NotificationItem({
  notification,
  onMarkAsRead,
  compact = false,
}: NotificationItemProps) {
  const Icon = typeIcons[notification.type] || Bell
  const colorClass = typeColors[notification.type] || 'text-[#676879] bg-[#F5F6F8]'
  const href = getNotificationHref(notification)

  const dateTime = notification.created_at
    ? formatDateTime(notification.created_at)
    : ''

  const actorName = notification.actor_display_name
  const actorInitial = actorName ? getInitials(actorName) : null

  const handleClick = () => {
    if (!notification.is_read && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
  }

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        notification.is_read
          ? 'bg-white hover:bg-[#F5F6F8]'
          : 'bg-[#F5F6F8] hover:bg-[#E6E9EF]'
      )}
      onClick={handleClick}
    >
      {/* Actor Avatar */}
      {actorInitial ? (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00A0B0] text-white text-xs font-medium shrink-0">
          {actorInitial}
        </div>
      ) : (
        <div className={cn('p-2 rounded-lg shrink-0', colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {!notification.is_read && (
            <span className="h-2 w-2 rounded-full bg-[#00A0B0] shrink-0" />
          )}
          <p className={cn(
            'text-sm truncate',
            notification.is_read ? 'text-[#676879]' : 'text-[#323338] font-medium'
          )}>
            {notification.title}
          </p>
        </div>
        <NotificationTypeContent notification={notification} compact={compact} />
        <p className="text-[10px] text-[#9B9BAD] mt-1">
          {actorName && `${actorName} · `}{dateTime}
        </p>
      </div>
      {/* Type icon shown as small badge when actor avatar is present */}
      {actorInitial && (
        <div className={cn('p-1.5 rounded-md shrink-0', colorClass)}>
          <Icon className="h-3 w-3" />
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
})
