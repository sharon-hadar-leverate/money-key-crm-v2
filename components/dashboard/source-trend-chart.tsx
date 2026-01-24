'use client'

import dynamic from 'next/dynamic'
import { Layers } from 'lucide-react'
import type { SourceTrendDay } from '@/actions/kpis'

interface SourceTrendChartProps {
  data: SourceTrendDay[]
  sources: string[]
}

function ChartSkeleton() {
  return (
    <div className="h-[200px] bg-[#F5F6F8] rounded animate-pulse" />
  )
}

const DynamicChart = dynamic(
  () => import('./source-trend-chart-inner'),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export function SourceTrendChart({ data, sources }: SourceTrendChartProps) {
  // Calculate totals per source
  const sourceTotals = sources.reduce((acc, source) => {
    acc[source] = data.reduce((sum, d) => sum + (typeof d[source] === 'number' ? d[source] as number : 0), 0)
    return acc
  }, {} as Record<string, number>)

  const totalLeads = Object.values(sourceTotals).reduce((sum, count) => sum + count, 0)
  const topSource = sources.length > 0 ? sources.reduce((a, b) => sourceTotals[a] > sourceTotals[b] ? a : b) : '-'

  return (
    <div className="monday-card overflow-hidden">
      <div className="widget-header">
        <div className="widget-header-icon bg-gradient-to-br from-[#EDD9FB] to-[#DCC4F0]">
          <Layers className="h-5 w-5 text-[#9D5BD2]" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h3 className="widget-title">לידים לפי מקור לאורך זמן</h3>
          <p className="widget-subtitle">פילוח לפי UTM Source</p>
        </div>
        <div className="flex gap-4">
          <div className="text-left px-4 py-2 rounded-xl bg-[#F5F6F8]/80">
            <p className="text-[#9B9BAD] text-[10px] uppercase tracking-wide font-medium">סה״כ</p>
            <p className="text-xl font-bold text-[#1a1d23] number-display">{totalLeads}</p>
          </div>
          <div className="text-left px-4 py-2 rounded-xl bg-[#EDD9FB]/50">
            <p className="text-[#9B9BAD] text-[10px] uppercase tracking-wide font-medium">מקור מוביל</p>
            <p className="text-base font-bold text-[#9D5BD2] truncate max-w-[100px]">{topSource}</p>
          </div>
        </div>
      </div>
      <div className="p-5 h-[280px]">
        <DynamicChart data={data} sources={sources} />
      </div>
    </div>
  )
}
