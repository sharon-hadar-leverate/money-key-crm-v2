'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { NotificationItem } from './notification-item'
import { markAsRead, markAllAsRead } from '@/actions/notifications'
import type { Notification } from '@/types/notifications'

interface NotificationDropdownProps {
  notifications: Notification[]
  onRefresh?: () => void
}

export function NotificationDropdown({
  notifications,
  onRefresh,
}: NotificationDropdownProps) {
  const [isPending, startTransition] = useTransition()

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      await markAsRead(id)
      onRefresh?.()
    })
  }

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      await markAllAsRead()
      onRefresh?.()
    })
  }

  const hasUnread = notifications.some(n => !n.is_read)

  return (
    <div className="w-80 bg-white rounded-xl shadow-lg border border-[#E6E9EF] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E6E9EF]">
        <h3 className="font-semibold text-[#323338]">התראות</h3>
        {hasUnread && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={isPending}
            className="text-xs text-[#00A0B0] hover:text-[#008090] transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCheck className="h-3 w-3" />
            )}
            סמן הכל כנקרא
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div className="p-3 rounded-full bg-[#F5F6F8] mb-3">
              <Bell className="h-6 w-6 text-[#9B9BAD]" />
            </div>
            <p className="text-sm text-[#676879]">אין התראות חדשות</p>
            <p className="text-xs text-[#9B9BAD] mt-1">
              כאן יופיעו עדכונים על לידים ומשימות
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-[#E6E9EF] p-2">
          <Link
            href="/notifications"
            className="block text-center text-sm text-[#00A0B0] hover:text-[#008090] py-2 rounded-lg hover:bg-[#F5F6F8] transition-colors"
          >
            צפה בכל ההתראות
          </Link>
        </div>
      )}
    </div>
  )
}
