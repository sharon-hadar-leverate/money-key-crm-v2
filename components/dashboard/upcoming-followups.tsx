'use client'

import Link from 'next/link'
import { CalendarClock, ChevronLeft, Phone, User } from 'lucide-react'
import { format, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns'
import { he } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/leads/status-badge'
import type { Lead } from '@/types/leads'

interface UpcomingFollowupsProps {
  leads: Lead[]
}

function getFollowUpLabel(date: Date): { text: string; className: string } {
  const time = format(date, 'HH:mm')
  if (isPast(date) && !isToday(date)) {
    const daysOverdue = differenceInDays(new Date(), date)
    return {
      text: `באיחור ${daysOverdue} ${daysOverdue === 1 ? 'יום' : 'ימים'}`,
      className: 'bg-[#FFD6D9] text-[#D83A52]',
    }
  }
  if (isToday(date)) {
    return { text: `${time} היום`, className: 'bg-[#FFF0D6] text-[#D17A00]' }
  }
  if (isTomorrow(date)) {
    return { text: `${time} מחר`, className: 'bg-[#E5F6F7] text-[#00A0B0]' }
  }
  const days = differenceInDays(date, new Date())
  if (days <= 7) {
    return { text: `${time} בעוד ${days} ימים`, className: 'bg-[#F5F6F8] text-[#676879]' }
  }
  return {
    text: format(date, 'HH:mm dd/MM', { locale: he }),
    className: 'bg-[#F5F6F8] text-[#676879]',
  }
}

export function UpcomingFollowups({ leads }: UpcomingFollowupsProps) {
  // Sort by follow_up_at date (overdue first, then ascending)
  const sortedLeads = [...leads].sort((a, b) => {
    const dateA = new Date(a.follow_up_at!)
    const dateB = new Date(b.follow_up_at!)
    const isPastA = isPast(dateA) && !isToday(dateA)
    const isPastB = isPast(dateB) && !isToday(dateB)

    // Overdue items first
    if (isPastA && !isPastB) return -1
    if (!isPastA && isPastB) return 1

    return dateA.getTime() - dateB.getTime()
  })

  if (sortedLeads.length === 0) {
    return (
      <div className="monday-card overflow-hidden">
        <div className="widget-header">
          <div className="widget-header-icon bg-gradient-to-br from-[#FFF0D6] to-[#FFE4B5]">
            <CalendarClock className="h-5 w-5 text-[#D17A00]" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h3 className="widget-title">לחזור בתאריך</h3>
            <p className="widget-subtitle">תזכורות מעקב מתוזמנות</p>
          </div>
        </div>
        <div className="p-8 text-center text-[#9B9BAD]">
          <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>אין תזכורות מעקב מתוזמנות</p>
        </div>
      </div>
    )
  }

  return (
    <div className="monday-card overflow-hidden">
      {/* Header */}
      <div className="widget-header border-b border-[#E6E9EF]">
        <div className="widget-header-icon bg-gradient-to-br from-[#FFF0D6] to-[#FFE4B5]">
          <CalendarClock className="h-5 w-5 text-[#D17A00]" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h3 className="widget-title">לחזור בתאריך</h3>
          <p className="widget-subtitle">{sortedLeads.length} תזכורות מעקב</p>
        </div>
        <Link
          href="/leads?hasFollowUp=true"
          className="flex items-center gap-1 text-sm text-[#00A0B0] hover:text-[#008A99] transition-colors"
        >
          צפה בכל
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </div>

      {/* List */}
      <div className="divide-y divide-[#E6E9EF]">
        {sortedLeads.map((lead) => {
          const followUpDate = new Date(lead.follow_up_at!)
          const label = getFollowUpLabel(followUpDate)
          const isOverdue = isPast(followUpDate) && !isToday(followUpDate)

          return (
            <Link
              key={lead.id}
              href={`/leads/${lead.id}`}
              className={cn(
                "flex items-center gap-4 px-5 py-3 transition-colors group",
                isOverdue
                  ? "bg-[#FFE5E5] hover:bg-[#FFD6D6]"
                  : "hover:bg-[#F5F6F8]"
              )}
            >
              {/* Avatar / Icon */}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                isOverdue ? "bg-[#FFD6D9]" : "bg-[#F5F6F8]"
              )}>
                <User className={cn(
                  "h-5 w-5",
                  isOverdue ? "text-[#D83A52]" : "text-[#676879]"
                )} />
              </div>

              {/* Lead info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#323338] truncate">
                    {lead.name}
                  </span>
                  <StatusBadge status={lead.status} size="sm" />
                </div>
                {lead.phone && (
                  <div className="flex items-center gap-1 text-xs text-[#9B9BAD] mt-0.5">
                    <Phone className="h-3 w-3" />
                    <span dir="ltr">{lead.phone}</span>
                  </div>
                )}
              </div>

              {/* Follow-up date badge */}
              <div className={cn(
                "px-2 py-1 rounded-md text-xs font-medium shrink-0",
                label.className
              )}>
                {label.text}
              </div>

              {/* Arrow on hover */}
              <ChevronLeft className="h-4 w-4 text-[#9B9BAD] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
