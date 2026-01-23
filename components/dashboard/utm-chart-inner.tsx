'use client'

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts'

const COLORS = [
  '#00A0B0',
  '#0073EA',
  '#D17A00',
  '#9D5BD2',
  '#D83A52',
]

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: {
      name: string
      leads: number
      customers: number
    }
  }>
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white rounded-lg px-4 py-3 shadow-lg border border-[#E6E9EF]">
        <p className="text-[#323338] font-medium text-sm mb-2">{data.name}</p>
        <div className="space-y-1">
          <p className="text-[#676879] text-xs flex justify-between gap-4">
            <span>לידים:</span>
            <span className="text-[#323338] font-medium">{data.leads}</span>
          </p>
          <p className="text-[#676879] text-xs flex justify-between gap-4">
            <span>לקוחות:</span>
            <span className="text-[#00854D] font-medium">{data.customers}</span>
          </p>
        </div>
      </div>
    )
  }
  return null
}

interface UTMBarChartInnerProps {
  chartData: Array<{ name: string; leads: number; customers: number; conversionRate: number }>
}

export default function UTMBarChartInner({ chartData }: UTMBarChartInnerProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
        barCategoryGap={10}
      >
        <XAxis
          type="number"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#9B9BAD' }}
        />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#323338' }}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 160, 176, 0.05)' }} />
        <Bar
          dataKey="leads"
          radius={[0, 6, 6, 0]}
          maxBarSize={28}
        >
          {chartData.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
