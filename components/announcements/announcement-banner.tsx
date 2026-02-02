'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, Info, CheckCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  CURRENT_ANNOUNCEMENT,
  isAnnouncementValid,
  type AnnouncementType,
} from '@/lib/announcements'
import { isDismissed, dismissAnnouncement } from '@/lib/announcement-utils'

const typeStyles: Record<AnnouncementType, {
  bg: string
  border: string
  text: string
  icon: typeof Info
}> = {
  info: {
    bg: 'bg-[#E5F6F7]',
    border: 'border-[#00A0B0]',
    text: 'text-[#00A0B0]',
    icon: Info,
  },
  success: {
    bg: 'bg-[#D4F4DD]',
    border: 'border-[#00854D]',
    text: 'text-[#00854D]',
    icon: CheckCircle,
  },
  warning: {
    bg: 'bg-[#FFF3CD]',
    border: 'border-[#F0AD4E]',
    text: 'text-[#856404]',
    icon: AlertTriangle,
  },
}

export function AnnouncementBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if we should show the announcement
    if (
      CURRENT_ANNOUNCEMENT &&
      isAnnouncementValid(CURRENT_ANNOUNCEMENT) &&
      !isDismissed(CURRENT_ANNOUNCEMENT.id)
    ) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    if (CURRENT_ANNOUNCEMENT) {
      dismissAnnouncement(CURRENT_ANNOUNCEMENT.id)
      setIsVisible(false)
    }
  }

  if (!isVisible || !CURRENT_ANNOUNCEMENT) {
    return null
  }

  const style = typeStyles[CURRENT_ANNOUNCEMENT.type]
  const Icon = style.icon

  return (
    <div
      className={cn(
        'border-b px-4 py-2.5',
        style.bg,
        style.border
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className={cn('h-5 w-5 shrink-0', style.text)} />
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-medium text-[#323338] text-sm">
              {CURRENT_ANNOUNCEMENT.title}
            </span>
            <span className="text-[#676879] text-sm truncate">
              {CURRENT_ANNOUNCEMENT.message}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {CURRENT_ANNOUNCEMENT.actionText && CURRENT_ANNOUNCEMENT.actionHref && (
            <Link
              href={CURRENT_ANNOUNCEMENT.actionHref}
              className={cn(
                'text-sm font-medium px-3 py-1 rounded-md transition-colors',
                style.text,
                'hover:bg-white/50'
              )}
            >
              {CURRENT_ANNOUNCEMENT.actionText}
            </Link>
          )}
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md hover:bg-white/50 transition-colors"
            aria-label="סגור הודעה"
          >
            <X className="h-4 w-4 text-[#676879]" />
          </button>
        </div>
      </div>
    </div>
  )
}
