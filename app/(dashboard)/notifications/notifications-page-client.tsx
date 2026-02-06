'use client'

import { useState, useTransition } from 'react'
import { Bell, CheckCheck, Loader2, Filter, X } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { NotificationItem } from '@/components/notifications/notification-item'
import { getAllNotifications, markAsRead, markAllAsRead } from '@/actions/notifications'
import { cn } from '@/lib/utils'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { NotificationWithActor, NotificationType } from '@/types/notifications'

interface NotificationsPageClientProps {
  initialNotifications: NotificationWithActor[]
  initialUnreadCount: number
  initialTotal: number
  actors: { user_id: string; display_name: string }[]
  leads: { lead_id: string; lead_name: string }[]
}

type FilterTab = 'all' | 'unread'

const notificationTypeLabels: Record<NotificationType, string> = {
  new_lead: 'ליד חדש',
  status_change: 'שינוי סטטוס',
  note_added: 'הערה חדשה',
  questionnaire_filled: 'שאלון הושלם',
  task_assigned: 'משימה שוייכה',
  task_due: 'משימה לביצוע',
}

export function NotificationsPageClient({
  initialNotifications,
  initialUnreadCount,
  initialTotal,
  actors,
  leads,
}: NotificationsPageClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [total, setTotal] = useState(initialTotal)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [isPending, startTransition] = useTransition()
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Advanced filters
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [actorFilter, setActorFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [leadFilter, setLeadFilter] = useState<string>('')

  const hasActiveFilters = !!dateRange || !!actorFilter || !!typeFilter || !!leadFilter

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

  const buildFilterOptions = (overrides?: {
    tab?: FilterTab
    actor?: string
    type?: string
    dateRange?: DateRange | undefined | null
    lead?: string
  }) => {
    const tab = overrides?.tab ?? filter
    const dr = overrides?.dateRange !== undefined
      ? (overrides.dateRange ?? undefined)
      : dateRange
    const actor = overrides?.actor !== undefined ? overrides.actor : actorFilter
    const typ = overrides?.type !== undefined ? overrides.type : typeFilter
    const lead = overrides?.lead !== undefined ? overrides.lead : leadFilter
    return {
      limit: 50,
      unreadOnly: tab === 'unread',
      actorUserId: actor || undefined,
      type: (typ || undefined) as NotificationType | undefined,
      dateFrom: dr?.from ? dr.from.toISOString() : undefined,
      dateTo: dr?.to
        ? new Date(dr.to.getTime() + 86400000 - 1).toISOString()
        : undefined,
      leadId: lead || undefined,
    }
  }

  const refetchNotifications = (overrides?: Parameters<typeof buildFilterOptions>[0]) => {
    startTransition(async () => {
      const result = await getAllNotifications(buildFilterOptions(overrides))
      setNotifications(result.notifications)
      setTotal(result.total)
    })
  }

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    try {
      const result = await getAllNotifications({
        ...buildFilterOptions(),
        limit: 20,
        offset: notifications.length,
      })
      setNotifications(prev => [...prev, ...result.notifications])
      setTotal(result.total)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleFilterChange = (newFilter: FilterTab) => {
    setFilter(newFilter)
    refetchNotifications({ tab: newFilter })
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    refetchNotifications({ dateRange: range ?? null })
  }

  const handleActorChange = (value: string) => {
    const v = value === '__all__' ? '' : value
    setActorFilter(v)
    refetchNotifications({ actor: v })
  }

  const handleTypeChange = (value: string) => {
    const v = value === '__all__' ? '' : value
    setTypeFilter(v)
    refetchNotifications({ type: v })
  }

  const handleLeadChange = (value: string) => {
    const v = value === '__all__' ? '' : value
    setLeadFilter(v)
    refetchNotifications({ lead: v })
  }

  const handleClearFilters = () => {
    setDateRange(undefined)
    setActorFilter('')
    setTypeFilter('')
    setLeadFilter('')
    refetchNotifications({ actor: '', type: '', lead: '', dateRange: null })
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

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-[#E6E9EF]">
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            placeholder="כל התקופה"
            className="w-[220px]"
          />

          {actors.length > 0 && (
            <Select value={actorFilter || '__all__'} onValueChange={handleActorChange}>
              <SelectTrigger className="w-[180px] h-10 bg-white border-[#E6E9EF]">
                <SelectValue placeholder="כל המשתמשים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">כל המשתמשים</SelectItem>
                {actors.map(a => (
                  <SelectItem key={a.user_id} value={a.user_id}>
                    {a.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={typeFilter || '__all__'} onValueChange={handleTypeChange}>
            <SelectTrigger className="w-[170px] h-10 bg-white border-[#E6E9EF]">
              <SelectValue placeholder="כל הסוגים" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">כל הסוגים</SelectItem>
              {Object.entries(notificationTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {leads.length > 0 && (
            <Select value={leadFilter || '__all__'} onValueChange={handleLeadChange}>
              <SelectTrigger className="w-[180px] h-10 bg-white border-[#E6E9EF]">
                <SelectValue placeholder="כל הלידים" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">כל הלידים</SelectItem>
                {leads.map(l => (
                  <SelectItem key={l.lead_id} value={l.lead_id}>
                    {l.lead_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-[#D83A52] hover:bg-[#FFE5E5] rounded-lg transition-colors"
            >
              <X className="h-3 w-3" />
              נקה סינונים
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="monday-card">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="p-4 rounded-full bg-[#F5F6F8] mb-4">
              <Bell className="h-8 w-8 text-[#9B9BAD]" />
            </div>
            <h3 className="text-lg font-semibold text-[#323338] mb-2">
              {hasActiveFilters
                ? 'אין התראות התואמות את הסינון'
                : filter === 'unread'
                  ? 'אין התראות שלא נקראו'
                  : 'אין התראות'}
            </h3>
            <p className="text-sm text-[#676879] max-w-sm">
              {hasActiveFilters
                ? 'נסה לשנות את הסינון או לנקות את הסינונים.'
                : filter === 'unread'
                  ? 'כל ההתראות שלך נקראו! עבודה טובה.'
                  : 'כאן יופיעו עדכונים על לידים חדשים, שינויי סטטוס, משימות ועוד.'}
            </p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#E6E9EF]">
              {notifications.map((notification) => (
                <div key={notification.id} className="p-2">
                  <NotificationItem
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
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
