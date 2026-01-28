'use client'

import { memo, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowDown, GitBranch, CheckCircle2, XCircle, TrendingUp, Users, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/leads/status-badge'
import type { StatusBreakdown } from '@/actions/kpis'
import type { Lead } from '@/types/leads'

interface StatusBreakdownChartProps {
  data: StatusBreakdown[]
  leads?: Lead[]
}

// Flow diagram structure - the journey from lead to customer
const FLOW_ROWS = [
  // Row 1: Initial contact phase
  {
    id: 'contact',
    title: 'יצירת קשר',
    items: [
      { statuses: ['not_contacted'], label: 'טרם יצרנו קשר', icon: '📞' },
      { statuses: ['no_answer'], label: 'אין מענה', icon: '📵' },
      { statuses: ['contacted'], label: 'נוצר קשר', icon: '✅' },
      { statuses: ['message_sent'], label: 'נשלחה הודעה', icon: '💬' },
    ],
    gradient: 'from-blue-500/10 to-blue-600/5',
    accentColor: '#0073EA',
    bgColor: 'bg-blue-50',
  },
  // Row 2: Negotiation phase
  {
    id: 'negotiation',
    title: 'משא ומתן',
    items: [
      { statuses: ['meeting_set'], label: 'נקבעה שיחה', icon: '📅' },
      { statuses: ['pending_agreement'], label: 'בהמתנה להסכם', icon: '📋' },
      { statuses: ['signed'], label: 'חתם על הסכם', icon: '✍️' },
    ],
    gradient: 'from-amber-500/10 to-orange-500/5',
    accentColor: '#D17A00',
    bgColor: 'bg-amber-50',
  },
  // Row 3: Customer process phase
  {
    id: 'customer',
    title: 'תהליך לקוח',
    items: [
      { statuses: ['under_review'], label: 'בבדיקה', icon: '🔍' },
      { statuses: ['missing_document'], label: 'חסר מסמך', icon: '📄' },
      { statuses: ['report_submitted'], label: 'הוגש דוח', icon: '📊' },
      { statuses: ['completed'], label: 'הושלם', icon: '🎉' },
    ],
    gradient: 'from-emerald-500/10 to-green-500/5',
    accentColor: '#00854D',
    bgColor: 'bg-emerald-50',
  },
] as const

// Exit statuses - leads that left the funnel
const EXIT_STATUSES = [
  { status: 'not_relevant', label: 'לא רלוונטי', icon: '❌' },
  { status: 'future_interest', label: 'מעוניין בעתיד', icon: '⏳' },
  { status: 'closed_elsewhere', label: 'סגר במקום אחר', icon: '🏢' },
] as const

// Helper to build leads URL with status filter
function buildLeadsUrl(statuses: readonly string[]): string {
  const params = new URLSearchParams()
  params.set('statuses', statuses.join(','))
  return `/leads?${params.toString()}`
}

// Memoized status box component for performance (rerender-memo)
const StatusBox = memo(function StatusBox({
  label,
  icon,
  count,
  accentColor,
  bgColor,
  isHighlighted,
  statuses,
}: {
  label: string
  icon: string
  count: number
  accentColor: string
  bgColor: string
  isHighlighted: boolean
  statuses: readonly string[]
}) {
  const href = buildLeadsUrl(statuses)

  return (
    <Link
      href={href}
      className={cn(
        "relative group rounded-2xl border-2 px-4 py-3 min-w-[100px] text-center block",
        "transition-all duration-300 ease-out cursor-pointer",
        "hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5",
        bgColor,
        count === 0 ? "opacity-40 hover:opacity-70" : "opacity-100",
        isHighlighted && "ring-2 ring-offset-2"
      )}
      style={{
        borderColor: count > 0 ? accentColor : '#E6E9EF',
        ...(isHighlighted ? { ringColor: accentColor } : {})
      }}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl"
        style={{ backgroundColor: `${accentColor}20` }}
      />

      {/* Icon */}
      <div className="text-xl mb-1">{icon}</div>

      {/* Label */}
      <p className="text-[11px] text-[#676879] leading-tight mb-1 font-medium">
        {label}
      </p>

      {/* Count */}
      <p
        className="text-2xl font-bold number-display tabular-nums"
        style={{ color: count > 0 ? accentColor : '#9B9BAD' }}
      >
        {count}
      </p>

      {/* View leads indicator on hover */}
      <div className="absolute inset-x-0 -bottom-1 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-white shadow-lg"
          style={{ backgroundColor: accentColor }}
        >
          <ExternalLink className="h-2.5 w-2.5" />
          צפה בלידים
        </span>
      </div>

      {/* Pulse indicator for active items */}
      {count > 0 && (
        <div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
          style={{ backgroundColor: accentColor }}
        />
      )}
    </Link>
  )
})

// Memoized exit status card component
const ExitStatusCard = memo(function ExitStatusCard({
  status,
  label,
  icon,
  count,
}: {
  status: string
  label: string
  icon: string
  count: number
}) {
  const href = buildLeadsUrl([status])

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-xl",
        "bg-gradient-to-l from-slate-50 to-slate-100",
        "border border-slate-200",
        "transition-all duration-200 hover:shadow-md hover:border-slate-300 hover:scale-[1.02]",
        "group cursor-pointer",
        count === 0 && "opacity-40 hover:opacity-70"
      )}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm text-[#676879] font-medium">{label}</span>
      <span className="px-2 py-0.5 rounded-lg bg-white text-sm font-bold text-[#323338] number-display shadow-sm">
        {count}
      </span>
      <ExternalLink className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  )
})

// Memoized arrow component
const FlowArrow = memo(function FlowArrow({ direction }: { direction: 'left' | 'down' }) {
  if (direction === 'down') {
    return (
      <div className="flex justify-center py-2">
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-4 bg-gradient-to-b from-[#E6E9EF] to-[#D0D4DB]" />
          <ArrowDown className="h-4 w-4 text-[#9B9BAD] -mt-1" />
        </div>
      </div>
    )
  }
  return (
    <div className="hidden md:flex items-center px-1">
      <div className="w-6 h-0.5 bg-gradient-to-l from-[#E6E9EF] to-[#D0D4DB]" />
      <ArrowLeft className="h-4 w-4 text-[#9B9BAD] -mr-1.5" />
    </div>
  )
})

// Quick preview table for each group - desktop only, scrollable
const QuickPreviewTable = memo(function QuickPreviewTable({
  leads,
  statuses,
  accentColor,
}: {
  leads: Lead[]
  statuses: readonly string[]
  accentColor: string
}) {
  // Filter leads by statuses in this group
  const previewLeads = useMemo(() => {
    return leads.filter(lead => statuses.includes(lead.status as string))
  }, [leads, statuses])

  if (previewLeads.length === 0) return null

  return (
    <div className="hidden xl:block w-[650px] shrink-0 mr-auto overflow-hidden rounded-lg border border-[#E6E9EF] bg-white/80 shadow-sm">
      {/* Scrollable container */}
      <div className="max-h-[120px] overflow-y-auto">
        <table className="w-full text-sm" dir="rtl">
          <tbody>
            {previewLeads.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-[#E6E9EF] last:border-b-0 hover:bg-[#F5F6F8]/50 transition-colors"
              >
                <td className="px-3 py-1.5 w-[140px]">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="font-medium hover:underline truncate block"
                    style={{ color: accentColor }}
                  >
                    {lead.name || '-'}
                  </Link>
                </td>
                <td className="px-3 py-1.5 w-[120px] text-[#676879] font-mono text-xs whitespace-nowrap" dir="ltr">
                  {lead.phone || '-'}
                </td>
                <td className="px-3 py-1.5 w-[100px] text-[#676879] text-xs whitespace-nowrap">
                  {lead.created_at ? new Date(lead.created_at).toLocaleDateString('he-IL') : '-'}
                </td>
                <td className="px-3 py-1.5">
                  <StatusBadge status={lead.status} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
})

export function StatusBreakdownChart({ data, leads = [] }: StatusBreakdownChartProps) {
  // Pre-compute status map for O(1) lookups (js-index-maps)
  const statusMap = useMemo(() => new Map(data.map(d => [d.status, d])), [data])

  // Memoize calculations (rerender-memo)
  const { totalLeads, exitTotal, activeLeads, completedCount } = useMemo(() => {
    const total = data.reduce((sum, d) => sum + d.count, 0)
    const exits = EXIT_STATUSES.reduce((sum, { status }) => {
      return sum + (statusMap.get(status)?.count || 0)
    }, 0)
    const completed = statusMap.get('completed')?.count || 0
    return {
      totalLeads: total,
      exitTotal: exits,
      activeLeads: total - exits,
      completedCount: completed,
    }
  }, [data, statusMap])

  // Get count for a status
  const getCount = (statuses: readonly string[]) => {
    return statuses.reduce((sum, status) => sum + (statusMap.get(status)?.count || 0), 0)
  }

  if (data.length === 0) {
    return (
      <div className="monday-card overflow-hidden">
        <div className="widget-header">
          <div className="widget-header-icon bg-gradient-to-br from-[#D4F4F7] to-[#B8E8ED]">
            <GitBranch className="h-5 w-5 text-[#00A0B0]" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <h3 className="widget-title">מסע הליד</h3>
            <p className="widget-subtitle">מליד ועד לקוח</p>
          </div>
        </div>
        <div className="p-8 text-center text-[#9B9BAD]">
          <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>אין נתונים להצגה</p>
        </div>
      </div>
    )
  }

  return (
    <div className="monday-card overflow-hidden">
      {/* Header */}
      <div className="widget-header border-b border-[#E6E9EF]">
        <div className="widget-header-icon bg-gradient-to-br from-[#D4F4F7] to-[#B8E8ED]">
          <GitBranch className="h-5 w-5 text-[#00A0B0]" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h3 className="widget-title">מסע הליד</h3>
          <p className="widget-subtitle">לחץ על כל שלב לצפייה בלידים</p>
        </div>

        {/* Stats badges */}
        <div className="flex gap-3">
          <Link
            href="/leads"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700 number-display">{activeLeads}</span>
            <span className="text-xs text-emerald-600">בתהליך</span>
          </Link>
          <Link
            href="/leads"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors"
          >
            <Users className="h-4 w-4 text-slate-600" />
            <span className="text-sm font-bold text-slate-700 number-display">{totalLeads}</span>
            <span className="text-xs text-slate-500">סה״כ</span>
          </Link>
        </div>
      </div>

      {/* Flow Diagram */}
      <div className="p-6">
        <div className="space-y-2">
          {FLOW_ROWS.map((row, rowIndex) => (
            <div key={row.id}>
              {/* Arrow between rows */}
              {rowIndex > 0 && <FlowArrow direction="down" />}

              {/* Row container with gradient background */}
              <div className={cn(
                "rounded-2xl p-4 bg-gradient-to-l",
                row.gradient
              )}>
                {/* Row title */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-1.5 h-5 rounded-full"
                    style={{ backgroundColor: row.accentColor }}
                  />
                  <span className="text-sm font-semibold text-[#323338]">
                    {row.title}
                  </span>
                </div>

                {/* Content: Status boxes + Preview table side by side on desktop */}
                <div className="flex flex-col xl:flex-row xl:items-start gap-4">
                  {/* Status boxes */}
                  <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start xl:shrink-0">
                    {row.items.map((item, itemIndex) => {
                      const count = getCount(item.statuses)
                      const isHighlighted = (item.statuses as readonly string[]).includes('completed') && count > 0

                      return (
                        <div key={item.statuses.join('-')} className="flex items-center">
                          <StatusBox
                            label={item.label}
                            icon={item.icon}
                            count={count}
                            accentColor={row.accentColor}
                            bgColor={row.bgColor}
                            isHighlighted={isHighlighted}
                            statuses={item.statuses}
                          />

                          {/* Arrow between items */}
                          {itemIndex < row.items.length - 1 && (
                            <FlowArrow direction="left" />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Quick preview table - desktop only, beside status boxes */}
                  {leads.length > 0 && (
                    <QuickPreviewTable
                      leads={leads}
                      statuses={row.items.flatMap(item => item.statuses)}
                      accentColor={row.accentColor}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Exit statuses section */}
        <div className="mt-6 pt-5 border-t-2 border-dashed border-[#E6E9EF]">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-red-50">
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
            <span className="text-sm font-semibold text-[#676879]">יציאות מהמשפך</span>
            <span className="px-2 py-0.5 rounded-full bg-red-50 text-xs font-medium text-red-600">
              {exitTotal}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            {EXIT_STATUSES.map(({ status, label, icon }) => {
              const count = statusMap.get(status)?.count || 0
              return (
                <ExitStatusCard
                  key={status}
                  status={status}
                  label={label}
                  icon={icon}
                  count={count}
                />
              )
            })}
          </div>
        </div>

        {/* Success indicator */}
        {completedCount > 0 && (
          <div className="mt-6 flex items-center justify-center">
            <Link
              href={buildLeadsUrl(['completed'])}
              className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-l from-emerald-50 to-green-50 border-2 border-emerald-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all group"
            >
              <div className="relative">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                <div className="absolute inset-0 animate-ping">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 opacity-30" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-600 number-display">
                  {completedCount}
                </p>
                <p className="text-xs text-emerald-500 font-medium">לקוחות הושלמו</p>
              </div>
              <span className="text-2xl">🎉</span>
              <ExternalLink className="h-4 w-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
