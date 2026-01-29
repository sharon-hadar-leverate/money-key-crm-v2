'use client'

import { EVENT_CONFIG, type EventType } from '@/types/leads'
import { RelativeTime } from '@/components/relative-time'
import { Plus, Pencil, ArrowLeftRight, RefreshCw, Trash, RotateCcw, Activity, Clock, MessageSquarePlus, MessageSquare, MessageSquareX } from 'lucide-react'

const ICONS: Record<EventType, typeof Plus> = {
  created: Plus,
  updated: Pencil,
  field_changed: ArrowLeftRight,
  status_changed: RefreshCw,
  deleted: Trash,
  restored: RotateCcw,
  note_added: MessageSquarePlus,
  note_updated: MessageSquare,
  note_deleted: MessageSquareX,
}

const EVENT_STYLES: Record<EventType, { bg: string; icon: string }> = {
  created: { bg: 'bg-[#D4F4DD]', icon: 'text-[#00854D]' },
  updated: { bg: 'bg-[#CCE5FF]', icon: 'text-[#0073EA]' },
  field_changed: { bg: 'bg-[#FFF0D6]', icon: 'text-[#D17A00]' },
  status_changed: { bg: 'bg-[#EDD9FB]', icon: 'text-[#9D5BD2]' },
  deleted: { bg: 'bg-[#FFD6D9]', icon: 'text-[#D83A52]' },
  restored: { bg: 'bg-[#D4F4F7]', icon: 'text-[#00A0B0]' },
  note_added: { bg: 'bg-[#FDEBDC]', icon: 'text-[#E07239]' },
  note_updated: { bg: 'bg-[#FDEBDC]', icon: 'text-[#E07239]' },
  note_deleted: { bg: 'bg-[#FFD6D9]', icon: 'text-[#D83A52]' },
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
      <div className="widget-header">
        <div className="widget-header-icon bg-gradient-to-br from-[#CCE5FF] to-[#B3D6FF]">
          <Activity className="h-5 w-5 text-[#0073EA]" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h3 className="widget-title">פעילות אחרונה</h3>
          <p className="widget-subtitle">עדכונים בזמן אמת</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#9B9BAD] bg-[#F5F6F8] px-2.5 py-1.5 rounded-full">
          <Clock className="w-3 h-3" />
          <span>24 שעות</span>
        </div>
      </div>

      {/* Activity list */}
      <div className="p-4">
        <div className="space-y-1">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#F5F6F8] to-[#E6E9EF] flex items-center justify-center mb-3">
                <Activity className="w-6 h-6 text-[#9B9BAD]" />
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
                    <Icon className={`h-4 w-4 ${styles.icon}`} strokeWidth={2} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a1d23] truncate">
                      {activity.lead_name}
                    </p>
                    <p className="text-xs text-[#676879]">
                      {config.label}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="flex-shrink-0 text-xs text-[#9B9BAD] tabular-nums bg-[#F5F6F8] px-2 py-1 rounded-md">
                    <RelativeTime date={activity.created_at} />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Footer */}
      {activities.length > 0 && (
        <div className="px-5 py-3 border-t border-[#E6E9EF]/50 bg-gradient-to-r from-[#FAFBFC] to-white">
          <button className="w-full text-xs text-[#00A0B0] hover:text-[#008A99] font-semibold transition-colors text-center py-1.5 rounded-lg hover:bg-[#00A0B0]/5">
            צפה בכל הפעילות →
          </button>
        </div>
      )}
    </div>
  )
}
