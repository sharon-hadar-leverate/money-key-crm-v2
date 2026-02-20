'use client'

import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'
import type { DailyTrend } from '@/actions/kpis'

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; payload: { date: string } }>
  label?: string
}

const TOOLTIP_LABELS: Record<string, { label: string; color: string }> = {
  total: { label: 'לידים:', color: '#0073EA' },
  converted: { label: 'הגיעו לסגירה:', color: '#00854D' },
  paymentCompleted: { label: 'גבייה הושלמה:', color: '#D17A00' },
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const isoDate = payload[0]?.payload?.date
    const dateStr = isoDate ? format(parseISO(isoDate), 'd בMMM', { locale: he }) : ''
    return (
      <div className="bg-white rounded-lg px-4 py-3 shadow-lg border border-[#E6E9EF]">
        <p className="text-[#323338] font-medium text-sm mb-2">{dateStr}</p>
        {payload.map((p) => {
          const config = TOOLTIP_LABELS[p.dataKey]
          return (
            <p key={p.dataKey} className="text-xs">
              <span className="text-[#676879]">{config?.label || p.dataKey} </span>
              <span className="font-medium" style={{ color: config?.color || '#323338' }}>
                {p.value}
              </span>
            </p>
          )
        })}
      </div>
    )
  }
  return null
}

interface Props {
  data: DailyTrend[]
}

export default function LeadsTrendChartInner({ data }: Props) {
  const chartData = data.map(d => ({
    ...d,
    dateLabel: format(parseISO(d.date), 'd/M', { locale: he }),
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0073EA" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#0073EA" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorConverted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00854D" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00854D" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPayment" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D17A00" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#D17A00" stopOpacity={0} />
          </linearGradient>
        </defs>
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
        <Area
          type="monotone"
          dataKey="total"
          stroke="#0073EA"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorTotal)"
        />
        <Area
          type="monotone"
          dataKey="converted"
          stroke="#00854D"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorConverted)"
        />
        <Area
          type="monotone"
          dataKey="paymentCompleted"
          stroke="#D17A00"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorPayment)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
