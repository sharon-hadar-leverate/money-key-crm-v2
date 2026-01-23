'use client'

import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { getStatusConfig } from '@/lib/status-utils'

interface StatusBadgeProps {
  status: string | null
  className?: string
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-[13px] px-3 py-1',
  lg: 'text-sm px-4 py-1.5',
} as const

export const StatusBadge = memo(function StatusBadge({
  status,
  className,
  size = 'md',
  interactive = false,
}: StatusBadgeProps) {
  const config = useMemo(() => getStatusConfig(status), [status])

  return (
    <span
      className={cn(
        'status-badge',
        config.cssClass,
        sizeClasses[size],
        interactive && 'cursor-pointer hover:ring-2 hover:ring-[#00A0B0]/30 transition-shadow',
        className
      )}
    >
      {config.label}
    </span>
  )
})
