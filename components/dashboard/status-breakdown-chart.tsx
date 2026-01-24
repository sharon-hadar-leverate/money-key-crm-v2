'use client'

import { ListChecks } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { StatusBreakdown } from '@/actions/kpis'
import type { PipelineStage } from '@/types/leads'

interface StatusBreakdownChartProps {
  data: StatusBreakdown[]
}

const STAGE_COLORS: Record<PipelineStage, { bg: string; text: string; bar: string; barBg: string }> = {
  follow_up: { bg: 'bg-[#CCE5FF]', text: 'text-[#0073EA]', bar: '#0073EA', barBg: 'rgba(0, 115, 234, 0.1)' },
  warm: { bg: 'bg-[#FFF0D6]', text: 'text-[#D17A00]', bar: '#D17A00', barBg: 'rgba(209, 122, 0, 0.1)' },
  hot: { bg: 'bg-[#FFEBE6]', text: 'text-[#D93D42]', bar: '#D93D42', barBg: 'rgba(217, 61, 66, 0.1)' },
  signed: { bg: 'bg-[#D4F4DD]', text: 'text-[#00854D]', bar: '#00854D', barBg: 'rgba(0, 133, 77, 0.1)' },
  lost: { bg: 'bg-[#FFD6D9]', text: 'text-[#D83A52]', bar: '#D83A52', barBg: 'rgba(216, 58, 82, 0.1)' },
  future: { bg: 'bg-[#D4F4F7]', text: 'text-[#00A0B0]', bar: '#00A0B0', barBg: 'rgba(0, 160, 176, 0.1)' },
}

export function StatusBreakdownChart({ data }: StatusBreakdownChartProps) {
  // Group by stage
  const grouped = data.reduce((acc, item) => {
    if (!acc[item.stage]) {
      acc[item.stage] = { stageHe: item.stageHe, items: [], total: 0, revenue: 0 }
    }
    acc[item.stage].items.push(item)
    acc[item.stage].total += item.count
    acc[item.stage].revenue += item.revenue
    return acc
  }, {} as Record<PipelineStage, { stageHe: string; items: StatusBreakdown[]; total: number; revenue: number }>)

  const stageOrder: PipelineStage[] = ['follow_up', 'warm', 'hot', 'signed', 'lost', 'future']
  const maxCount = Math.max(...data.map(d => d.count), 1)
  const totalLeads = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="monday-card overflow-hidden">
      {/* Header */}
      <div className="widget-header">
        <div className="widget-header-icon bg-gradient-to-br from-[#D4F4F7] to-[#B8E8ED]">
          <ListChecks className="h-5 w-5 text-[#00A0B0]" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h3 className="widget-title">פירוט סטטוסים</h3>
          <p className="widget-subtitle">כל הסטטוסים לפי שלב</p>
        </div>
        <div className="text-left">
          <p className="text-xs text-[#9B9BAD]">סה״כ</p>
          <p className="text-lg font-bold text-[#1a1d23] number-display">{totalLeads}</p>
        </div>
      </div>

      {/* Content - Vertical layout for stages */}
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stageOrder.map((stage) => {
            const group = grouped[stage]
            if (!group) return null

            const colors = STAGE_COLORS[stage]

            return (
              <div
                key={stage}
                className="rounded-xl p-4 transition-all hover:shadow-md min-h-[160px]"
                style={{ backgroundColor: colors.barBg }}
              >
                {/* Stage header */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${colors.bg} ${colors.text}`}>
                    {group.stageHe}
                  </span>
                  <span className="text-lg font-bold number-display" style={{ color: colors.bar }}>
                    {group.total}
                  </span>
                </div>

                {/* Status items - show ALL statuses */}
                <div className="space-y-2.5">
                  {group.items.map((item) => (
                    <div key={item.status} className="group">
                      <div className="flex items-start justify-between mb-1 gap-2">
                        <span className="text-xs text-[#676879] whitespace-normal leading-tight flex-1">
                          {item.statusHe}
                        </span>
                        <span className="text-xs font-semibold text-[#323338] number-display shrink-0">
                          {item.count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.max((item.count / maxCount) * 100, 4)}%`,
                            backgroundColor: colors.bar,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Revenue if exists */}
                {group.revenue > 0 && (
                  <div className="mt-3 pt-2 border-t border-white/30">
                    <span className="text-[10px] text-[#676879] number-display">
                      {formatCurrency(group.revenue)}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {data.length === 0 && (
          <div className="text-center py-12 text-[#9B9BAD]">
            <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p>אין נתונים להצגה</p>
          </div>
        )}
      </div>
    </div>
  )
}
