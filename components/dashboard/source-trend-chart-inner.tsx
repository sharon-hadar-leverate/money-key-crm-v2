'use client'

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from 'recharts'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'
import type { SourceTrendDay } from '@/actions/kpis'

// Color palette for sources - distinct solid colors that stack well
const SOURCE_COLORS = [
  '#9D5BD2', // Purple
  '#0073EA', // Blue
  '#00854D', // Green
  '#D17A00', // Orange
  '#D93D42', // Red
  '#00A0B0', // Teal
  '#9B9BAD', // Gray (for "אחר")
]

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string; payload: { date: string } }>
  label?: string
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const isoDate = payload[0]?.payload?.date
    const dateStr = isoDate ? format(parseISO(isoDate), 'd בMMM', { locale: he }) : ''
    const total = payload.reduce((sum, p) => sum + (p.value || 0), 0)

    return (
      <div className="bg-white rounded-lg px-4 py-3 shadow-lg border border-[#E6E9EF] max-w-[200px]">
        <p className="text-[#323338] font-medium text-sm mb-2">{dateStr}</p>
        <p className="text-xs text-[#676879] mb-2 pb-2 border-b border-[#E6E9EF]">
          סה״כ: <span className="font-semibold text-[#323338]">{total}</span>
        </p>
        <div className="space-y-1">
          {payload
            .filter(p => p.value > 0)
            .sort((a, b) => b.value - a.value)
            .map((p) => (
              <p key={p.dataKey} className="text-xs flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-[#676879] truncate">{p.dataKey}</span>
                </span>
                <span className="font-medium text-[#323338] number-display">{p.value}</span>
              </p>
            ))}
        </div>
      </div>
    )
  }
  return null
}

interface Props {
  data: SourceTrendDay[]
  sources: string[]
}

export default function SourceTrendChartInner({ data, sources }: Props) {
  // Format dates for display
  const chartData = data.map(d => ({
    ...d,
    dateLabel: format(parseISO(d.date), 'd/M', { locale: he }),
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E6E9EF" vertical={false} />
        <XAxis
          dataKey="dateLabel"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#9B9BAD', fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#9B9BAD', fontSize: 10 }}
          width={30}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="top"
          align="right"
          iconType="square"
          iconSize={10}
          wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
          formatter={(value) => <span className="text-[#676879] text-xs">{value}</span>}
        />
        {sources.map((source, i) => (
          <Area
            key={source}
            type="stepAfter"
            dataKey={source}
            stackId="1"
            stroke={SOURCE_COLORS[i % SOURCE_COLORS.length]}
            strokeWidth={0}
            fill={SOURCE_COLORS[i % SOURCE_COLORS.length]}
            fillOpacity={0.85}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
