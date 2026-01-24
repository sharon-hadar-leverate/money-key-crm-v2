'use client'

import dynamic from 'next/dynamic'
import { TrendingUp } from 'lucide-react'
import type { DailyTrend } from '@/actions/kpis'

interface LeadsTrendChartProps {
  data: DailyTrend[]
}

function ChartSkeleton() {
  return (
    <div className="h-[200px] bg-[#F5F6F8] rounded animate-pulse" />
  )
}

const DynamicChart = dynamic(
  () => import('./leads-trend-chart-inner'),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export function LeadsTrendChart({ data }: LeadsTrendChartProps) {
  const totalLeads = data.reduce((sum, d) => sum + d.total, 0)
  const totalConverted = data.reduce((sum, d) => sum + d.converted, 0)
  const conversionRate = totalLeads > 0 ? ((totalConverted / totalLeads) * 100).toFixed(1) : '0'

  return (
    <div className="monday-card overflow-hidden">
      <div className="widget-header">
        <div className="widget-header-icon bg-gradient-to-br from-[#CCE5FF] to-[#B3D6FF]">
          <TrendingUp className="h-5 w-5 text-[#0073EA]" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h3 className="widget-title">לידים לאורך זמן</h3>
          <p className="widget-subtitle">30 ימים אחרונים</p>
        </div>
        <div className="flex gap-6">
          <div className="text-left px-4 py-2 rounded-xl bg-[#F5F6F8]/80">
            <p className="text-[#9B9BAD] text-[10px] uppercase tracking-wide font-medium">סה״כ</p>
            <p className="text-xl font-bold text-[#1a1d23] number-display">{totalLeads}</p>
          </div>
          <div className="text-left px-4 py-2 rounded-xl bg-[#D4F4DD]/50">
            <p className="text-[#9B9BAD] text-[10px] uppercase tracking-wide font-medium">הומרו</p>
            <p className="text-xl font-bold text-[#00854D] number-display">{totalConverted}</p>
          </div>
          <div className="text-left px-4 py-2 rounded-xl bg-[#EDD9FB]/50">
            <p className="text-[#9B9BAD] text-[10px] uppercase tracking-wide font-medium">המרה</p>
            <p className="text-xl font-bold text-[#9D5BD2] number-display">{conversionRate}%</p>
          </div>
        </div>
      </div>
      <div className="p-5 h-[220px]">
        <DynamicChart data={data} />
      </div>
    </div>
  )
}
