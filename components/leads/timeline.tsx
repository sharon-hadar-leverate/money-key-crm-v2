'use client'

import { EVENT_CONFIG, type EventType } from '@/types/leads'
import { RelativeTime } from '@/components/relative-time'
import type { LeadEvent } from '@/types/leads'
import { Plus, Pencil, ArrowLeftRight, RefreshCw, Trash, RotateCcw, History, MessageSquarePlus, MessageSquare, MessageSquareX } from 'lucide-react'

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

interface TimelineProps {
  events: LeadEvent[]
}

export function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-12 h-12 rounded-full bg-[#F5F6F8] flex items-center justify-center mb-3">
          <History className="w-5 h-5 text-[#9B9BAD]" />
        </div>
        <p className="text-sm text-[#676879]">אין היסטוריית פעולות</p>
      </div>
    )
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, eventIdx) => {
          const eventType = event.event_type as EventType
          const config = EVENT_CONFIG[eventType] || EVENT_CONFIG.updated
          const Icon = ICONS[eventType] || Pencil

          return (
            <li key={event.id}>
              <div className="relative pb-8">
                {eventIdx !== events.length - 1 && (
                  <span
                    className="absolute top-10 right-[15px] -mr-px h-full w-[2px] bg-[#E6E9EF]"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start gap-4">
                  <div className="relative">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${config.bgColor} transition-transform hover:scale-105`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-[#323338]">
                        {config.label}
                      </p>
                      <RelativeTime date={event.created_at} className="text-xs text-[#9B9BAD] tabular-nums whitespace-nowrap" />
                    </div>
                    {event.field_name && (
                      <p className="text-xs text-[#676879] mt-1">
                        <span className="text-[#323338]">{event.field_name}</span>
                        {event.old_value && event.new_value && (
                          <span className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded bg-[#FFD6D9] text-[#D83A52] line-through">
                              {event.old_value}
                            </span>
                            <span className="text-[#9B9BAD]">→</span>
                            <span className="px-2 py-0.5 rounded bg-[#D4F4DD] text-[#00854D]">
                              {event.new_value}
                            </span>
                          </span>
                        )}
                      </p>
                    )}
                    {event.user_email && (
                      <p className="text-xs text-[#9B9BAD] mt-1">
                        ע&quot;י: {event.user_email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
