'use client'

import { useHydrated } from '@/hooks/use-hydrated'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { formatDate } from '@/lib/utils'

interface RelativeTimeProps {
  date: string | Date | null
  className?: string
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const isHydrated = useHydrated()

  if (!date) return <span className={className}>-</span>

  // Before hydration: static date (matches server)
  if (!isHydrated) {
    return <span className={className}>{formatDate(date)}</span>
  }

  // After hydration: relative time
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return (
      <span className={className}>
        {formatDistanceToNow(dateObj, { addSuffix: true, locale: he })}
      </span>
    )
  } catch {
    return <span className={className}>{formatDate(date)}</span>
  }
}
