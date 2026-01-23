import { cn } from '@/lib/utils'
import { STATUS_CONFIG, type LeadStatus } from '@/types/leads'

interface StatusBadgeProps {
  status: string | null
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusKey = (status || 'new') as LeadStatus
  const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.new

  return (
    <span
      className={cn(
        'status-badge',
        config.cssClass,
        className
      )}
    >
      {config.label}
    </span>
  )
}
