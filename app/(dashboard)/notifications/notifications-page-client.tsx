'use client'

import { useState, useTransition } from 'react'
import { Bell, CheckCheck, Loader2, Filter } from 'lucide-react'
import { NotificationItem } from '@/components/notifications/notification-item'
import { getAllNotifications, markAsRead, markAllAsRead } from '@/actions/notifications'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types/notifications'

interface NotificationsPageClientProps {
  initialNotifications: Notification[]
  initialUnreadCount: number
  initialTotal: number
}

type FilterTab = 'all' | 'unread'

export function NotificationsPageClient({
  initialNotifications,
  initialUnreadCount,
  initialTotal,
}: NotificationsPageClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [total, setTotal] = useState(initialTotal)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [isPending, startTransition] = useTransition()
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const displayedNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications

  const hasMore = notifications.length < total

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      await markAsRead(id)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    })
  }

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      await markAllAsRead()
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    })
  }

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const result = await getAllNotifications({
        limit: 20,
        offset: notifications.length,
        unreadOnly: filter === 'unread',
      })
      setNotifications(prev => [...prev, ...result.notifications])
      setTotal(result.total)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleFilterChange = (newFilter: FilterTab) => {
    startTransition(async () => {
      setFilter(newFilter)
      // Refetch with new filter
      const result = await getAllNotifications({
        limit: 50,
        unreadOnly: newFilter === 'unread',
      })
      setNotifications(result.notifications)
      setTotal(result.total)
    })
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="monday-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#676879]" />
            <div className="flex gap-1 bg-[#F5F6F8] rounded-lg p-1">
              <button
                onClick={() => handleFilterChange('all')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  filter === 'all'
                    ? 'bg-white text-[#323338] shadow-sm'
                    : 'text-[#676879] hover:text-[#323338]'
                )}
              >
                הכל ({total})
              </button>
              <button
                onClick={() => handleFilterChange('unread')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  filter === 'unread'
                    ? 'bg-white text-[#323338] shadow-sm'
                    : 'text-[#676879] hover:text-[#323338]'
                )}
              >
                לא נקראו ({unreadCount})
              </button>
            </div>
          </div>

          {/* Mark All as Read */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#00A0B0] hover:text-[#008090] hover:bg-[#E5F6F7] rounded-lg transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              סמן הכל כנקרא
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="monday-card">
        {displayedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="p-4 rounded-full bg-[#F5F6F8] mb-4">
              <Bell className="h-8 w-8 text-[#9B9BAD]" />
            </div>
            <h3 className="text-lg font-semibold text-[#323338] mb-2">
              {filter === 'unread' ? 'אין התראות שלא נקראו' : 'אין התראות'}
            </h3>
            <p className="text-sm text-[#676879] max-w-sm">
              {filter === 'unread'
                ? 'כל ההתראות שלך נקראו! עבודה טובה.'
                : 'כאן יופיעו עדכונים על לידים חדשים, שינויי סטטוס, משימות ועוד.'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#E6E9EF]">
              {displayedNotifications.map((notification) => (
                <div key={notification.id} className="p-2">
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && filter === 'all' && (
              <div className="p-4 border-t border-[#E6E9EF]">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="w-full py-2.5 text-sm font-medium text-[#00A0B0] hover:text-[#008090] hover:bg-[#E5F6F7] rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      טוען...
                    </>
                  ) : (
                    `טען עוד (${total - notifications.length} נותרו)`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
