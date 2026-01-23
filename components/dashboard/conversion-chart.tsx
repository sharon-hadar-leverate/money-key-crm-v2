'use client'

import dynamic from 'next/dynamic'
import type { ConversionFunnelItem } from '@/types/leads'
import { PieChart as PieIcon } from 'lucide-react'

interface ConversionChartProps {
  data: ConversionFunnelItem[]
}

const COLORS = {
  new: { fill: '#0073EA', bg: '#CCE5FF' },
  contacted: { fill: '#D17A00', bg: '#FFF0D6' },
  customer: { fill: '#00854D', bg: '#D4F4DD' },
  lost: { fill: '#D83A52', bg: '#FFD6D9' },
}

// Loading skeleton for the chart
function ChartSkeleton() {
  return (
    <div className="h-[180px] w-[180px] flex-shrink-0 flex items-center justify-center">
      <div className="w-[160px] h-[160px] rounded-full bg-[#F5F6F8] animate-pulse relative">
        <div className="absolute inset-[30px] rounded-full bg-white" />
      </div>
    </div>
  )
}

// Dynamically import the inner chart component
const DynamicPieChart = dynamic(
  () => import('./conversion-chart-inner'),
  {
    ssr: false,
    loading: () => <ChartSkeleton />
  }
)

export function ConversionChart({ data }: ConversionChartProps) {
  const chartData = data.map((item) => ({
    name: item.stageHe,
    value: item.count,
    stage: item.stage,
    percentage: item.percentage,
  }))

  const total = data.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="monday-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E6E9EF]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#D4F4DD]">
            <PieIcon className="h-4 w-4 text-[#00854D]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#323338]">לידים לפי סטטוס</h3>
            <p className="text-xs text-[#9B9BAD]">התפלגות סטטוסים</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-5">
        <div className="flex items-center gap-6">
          {/* Pie Chart */}
          <div className="h-[180px] w-[180px] flex-shrink-0">
            <DynamicPieChart chartData={chartData} total={total} />
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {chartData.map((item) => {
              const color = COLORS[item.stage as keyof typeof COLORS]
              return (
                <div
                  key={item.stage}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#F5F6F8] hover:bg-[#ECEDF0] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color?.fill || '#C4C4C4' }}
                    />
                    <span className="text-sm text-[#323338]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#323338] number-display">
                      {item.value}
                    </span>
                    <span className="text-xs text-[#9B9BAD] w-10 text-left">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
