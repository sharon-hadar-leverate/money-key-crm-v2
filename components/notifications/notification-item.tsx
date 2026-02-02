'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  UserPlus,
  ArrowLeftRight,
  MessageSquare,
  ClipboardCheck,
  CheckSquare,
  Bell,
} from 'lucide-react'
import type { Notification } from '@/types/notifications'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: string) => void
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

function getNotificationHref(notification: Notification): string | null {
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

export function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const Icon = typeIcons[notification.type] || Bell
  const colorClass = typeColors[notification.type] || 'text-[#676879] bg-[#F5F6F8]'
  const href = getNotificationHref(notification)

  const timeAgo = notification.created_at
    ? formatDistanceToNow(new Date(notification.created_at), {
        addSuffix: true,
        locale: he,
      })
    : ''

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
      <div className={cn('p-2 rounded-lg shrink-0', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
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
        {notification.body && (
          <p className="text-xs text-[#9B9BAD] mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="text-[10px] text-[#9B9BAD] mt-1">
          {timeAgo}
        </p>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
