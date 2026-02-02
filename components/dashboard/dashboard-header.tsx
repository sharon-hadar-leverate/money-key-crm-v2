'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { DateRange } from 'react-day-picker'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import profileImage from '@/app/assets/profile_image_no_bg.png'
import { NotificationBell } from '@/components/notifications'

export function DashboardHeader() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [supabase])

  // Parse date range from URL search params
  const dateRange = useMemo((): DateRange | undefined => {
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!from) return undefined

    return {
      from: parseISO(from),
      to: to ? parseISO(to) : parseISO(from),
    }
  }, [searchParams])

  // Update URL when date range changes
  const handleDateChange = useCallback((range: DateRange | undefined) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (range?.from) {
        // Format as ISO date (YYYY-MM-DD) for URL
        params.set('from', format(startOfDay(range.from), 'yyyy-MM-dd'))
        if (range.to) {
          params.set('to', format(endOfDay(range.to), 'yyyy-MM-dd'))
        } else {
          params.delete('to')
        }
      } else {
        // Clear date filters
        params.delete('from')
        params.delete('to')
      }

      router.push(`/dashboard?${params.toString()}`)
    })
  }, [router, searchParams])

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6 pb-0">
      <div>
        <h1 className="text-2xl font-bold text-[#323338]">לוח בקרה</h1>
        <p className="text-sm text-[#676879]">
          {dateRange?.from
            ? `נתונים מסוננים לפי תאריך`
            : 'סקירת ביצועים כללית'
          }
        </p>
      </div>

      <div className="flex items-center gap-3">
        {isPending && (
          <Loader2 className="h-4 w-4 animate-spin text-[#0073EA]" />
        )}
        <DateRangePicker
          value={dateRange}
          onChange={handleDateChange}
          placeholder="כל התקופה"
          className="w-[240px]"
        />

        {/* Notifications */}
        <NotificationBell />

        {/* User Avatar */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F5F6F8] transition-colors cursor-pointer">
          <Image
            src={profileImage}
            alt={user?.email?.split('@')[0] || 'User'}
            width={32}
            height={32}
            className="rounded-lg"
          />
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-[#323338] leading-none">
              {user?.email?.split('@')[0] || 'משתמש'}
            </p>
            <p className="text-[10px] text-[#676879] mt-0.5">מנהל</p>
          </div>
        </div>
      </div>
    </header>
  )
}
