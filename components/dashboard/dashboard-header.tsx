'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useTransition } from 'react'
import { DateRange } from 'react-day-picker'
import { format, parseISO, startOfDay, endOfDay } from 'date-fns'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { Loader2 } from 'lucide-react'

export function DashboardHeader() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

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
      </div>
    </header>
  )
}
