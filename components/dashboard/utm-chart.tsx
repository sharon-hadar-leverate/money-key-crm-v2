'use client'

import dynamic from 'next/dynamic'
import type { UTMPerformance } from '@/types/leads'
import { BarChart3, TrendingUp } from 'lucide-react'

interface UTMChartProps {
  data: UTMPerformance[]
}

// Loading skeleton for the bar chart
function ChartSkeleton() {
  return (
    <div className="h-[220px] flex flex-col justify-center gap-3 px-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-16 h-4 bg-[#F5F6F8] rounded animate-pulse" />
          <div
            className="h-6 bg-[#F5F6F8] rounded animate-pulse"
            style={{ width: `${80 - i * 15}%` }}
          />
        </div>
      ))}
    </div>
  )
}

// Dynamically import the inner chart component
const DynamicBarChart = dynamic(
  () => import('./utm-chart-inner'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export function UTMChart({ data }: UTMChartProps) {
  const chartData = data.map((item) => ({
    name: item.source,
    leads: item.leadCount,
    customers: item.customerCount,
    conversionRate: item.conversionRate,
  }))

  const totalLeads = data.reduce((sum, item) => sum + item.leadCount, 0)
  const bestSource = data.length > 0 ? data[0] : null

  return (
    <div className="monday-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E6E9EF]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#CCE5FF]">
              <BarChart3 className="h-4 w-4 text-[#0073EA]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#323338]">לידים לפי מקור</h3>
              <p className="text-xs text-[#9B9BAD]">ביצועי קמפיינים</p>
            </div>
          </div>
          {bestSource && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#D4F4DD]">
              <TrendingUp className="w-3 h-3 text-[#00854D]" />
              <span className="text-xs text-[#00854D] font-medium">
                {bestSource.source} מוביל
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="p-5">
        <div className="h-[220px]">
          <DynamicBarChart chartData={chartData} />
        </div>

        {/* Summary stats */}
        <div className="mt-4 pt-4 border-t border-[#E6E9EF] flex items-center justify-between">
          <div className="text-xs text-[#9B9BAD]">
            סה״כ {totalLeads} לידים מ-{data.length} מקורות
          </div>
          {bestSource && bestSource.conversionRate > 0 && (
            <div className="text-xs text-[#676879]">
              המרה ממוצעת: <span className="text-[#00854D] font-medium">{bestSource.conversionRate.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
