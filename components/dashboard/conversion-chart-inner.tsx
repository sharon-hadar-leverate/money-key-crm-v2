'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = {
  new: { fill: '#0073EA', bg: '#CCE5FF' },
  contacted: { fill: '#D17A00', bg: '#FFF0D6' },
  customer: { fill: '#00854D', bg: '#D4F4DD' },
  lost: { fill: '#D83A52', bg: '#FFD6D9' },
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: {
      stage: string
      percentage: number
    }
  }>
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0]
    return (
      <div className="bg-white rounded-lg px-4 py-3 shadow-lg border border-[#E6E9EF]">
        <p className="text-[#323338] font-medium text-sm">{data.name}</p>
        <p className="text-[#676879] text-xs mt-1">
          {data.value} לידים ({data.payload.percentage.toFixed(1)}%)
        </p>
      </div>
    )
  }
  return null
}

interface ConversionPieChartInnerProps {
  chartData: Array<{ name: string; value: number; stage: string; percentage: number }>
  total: number
}

export default function ConversionPieChartInner({ chartData, total }: ConversionPieChartInnerProps) {
  return (
    <>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.stage}
                fill={COLORS[entry.stage as keyof typeof COLORS]?.fill || '#C4C4C4'}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center text */}
      <div className="relative -mt-[130px] flex flex-col items-center justify-center h-[80px] pointer-events-none">
        <span className="text-2xl font-bold text-[#323338] number-display">{total}</span>
        <span className="text-xs text-[#9B9BAD]">סה״כ לידים</span>
      </div>
    </>
  )
}
