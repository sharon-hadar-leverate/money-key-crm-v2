'use client'

import { formatRelativeTime } from '@/lib/utils'
import { EVENT_CONFIG, type EventType } from '@/types/leads'
import { Plus, Pencil, ArrowLeftRight, RefreshCw, Trash, RotateCcw, Activity, Clock } from 'lucide-react'

const ICONS = {
  created: Plus,
  updated: Pencil,
  field_changed: ArrowLeftRight,
  status_changed: RefreshCw,
  deleted: Trash,
  restored: RotateCcw,
}

const EVENT_STYLES: Record<EventType, { bg: string; icon: string }> = {
  created: { bg: 'bg-[#D4F4DD]', icon: 'text-[#00854D]' },
  updated: { bg: 'bg-[#CCE5FF]', icon: 'text-[#0073EA]' },
  field_changed: { bg: 'bg-[#FFF0D6]', icon: 'text-[#D17A00]' },
  status_changed: { bg: 'bg-[#EDD9FB]', icon: 'text-[#9D5BD2]' },
  deleted: { bg: 'bg-[#FFD6D9]', icon: 'text-[#D83A52]' },
  restored: { bg: 'bg-[#D4F4F7]', icon: 'text-[#00A0B0]' },
}

interface RecentActivityProps {
  activities: {
    id: string
    lead_name: string
    event_type: string
    created_at: string
    user_email: string | null
  }[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="monday-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E6E9EF]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FFF0D6]">
              <Activity className="h-4 w-4 text-[#D17A00]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#323338]">פעילות אחרונה</h3>
              <p className="text-xs text-[#9B9BAD]">עדכונים בזמן אמת</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#9B9BAD]">
            <Clock className="w-3 h-3" />
            <span>24 שעות אחרונות</span>
          </div>
        </div>
      </div>

      {/* Activity list */}
      <div className="p-3">
        <div className="space-y-1">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-12 h-12 rounded-full bg-[#F5F6F8] flex items-center justify-center mb-3">
                <Activity className="w-5 h-5 text-[#9B9BAD]" />
              </div>
              <p className="text-sm text-[#676879]">אין פעילות אחרונה</p>
            </div>
          ) : (
            activities.map((activity) => {
              const eventType = activity.event_type as EventType
              const config = EVENT_CONFIG[eventType] || EVENT_CONFIG.updated
              const Icon = ICONS[eventType] || Pencil
              const styles = EVENT_STYLES[eventType] || EVENT_STYLES.updated

              return (
                <div
                  key={activity.id}
                  className="activity-item"
                >
                  {/* Icon */}
                  <div className={`activity-icon ${styles.bg}`}>
                    <Icon className={`h-4 w-4 ${styles.icon}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#323338] truncate">
                      {activity.lead_name}
                    </p>
                    <p className="text-xs text-[#9B9BAD]">
                      {config.label}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="flex-shrink-0 text-xs text-[#9B9BAD] tabular-nums">
                    {formatRelativeTime(activity.created_at)}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Footer */}
      {activities.length > 0 && (
        <div className="px-5 py-3 border-t border-[#E6E9EF] bg-[#FAFBFC]">
          <button className="w-full text-xs text-[#00A0B0] hover:text-[#008A99] font-medium transition-colors text-center">
            צפה בכל הפעילות
          </button>
        </div>
      )}
    </div>
  )
}
