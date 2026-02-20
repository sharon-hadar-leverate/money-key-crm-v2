'use client'

import { useState } from 'react'
import { Shield, ChevronDown, ChevronUp, CheckCircle, AlertTriangle } from 'lucide-react'
import type { DataQualityHealth } from '@/actions/kpis'

interface DataQualityPanelProps {
  data: DataQualityHealth
}

interface HealthMetric {
  label: string
  value: string
  isHealthy: boolean
}

export function DataQualityPanel({ data }: DataQualityPanelProps) {
  const [isOpen, setIsOpen] = useState(false)

  const metrics: HealthMetric[] = [
    {
      label: 'כיסוי אירועים',
      value: `${data.eventCoveragePercent}%`,
      isHealthy: data.eventCoveragePercent >= 80,
    },
    {
      label: 'סטטוסים ישנים',
      value: data.deprecatedStatusCount === 0 ? 'אין' : `${data.deprecatedStatusCount} לידים`,
      isHealthy: data.deprecatedStatusCount === 0,
    },
    {
      label: 'נראות הכנסות',
      value: `${data.revenueVisibilityPercent}%`,
      isHealthy: data.revenueVisibilityPercent >= 80,
    },
    {
      label: 'בדיקה אחרונה',
      value: new Date(data.lastCheckTime).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' }),
      isHealthy: true,
    },
  ]

  const allHealthy = metrics.every(m => m.isHealthy)

  return (
    <div className="monday-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-5 py-3 text-right hover:bg-[#F5F6F8]/50 transition-colors"
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          allHealthy
            ? 'bg-gradient-to-br from-[#D4F4DD] to-[#B8E8C4]'
            : 'bg-gradient-to-br from-[#FFF0D6] to-[#FFE4B8]'
        }`}>
          <Shield className={`h-4 w-4 ${allHealthy ? 'text-[#00854D]' : 'text-[#D17A00]'}`} />
        </div>
        <div className="flex-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-[#323338]">בריאות נתונים</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
            allHealthy
              ? 'bg-[#D4F4DD] text-[#00854D]'
              : 'bg-[#FFF0D6] text-[#D17A00]'
          }`}>
            {allHealthy ? 'הכל תקין' : 'יש בעיות'}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-[#9B9BAD]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#9B9BAD]" />
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-2">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                metric.isHealthy
                  ? 'border-[#D4F4DD]/60 bg-[#F5FFF8]'
                  : 'border-[#FFF0D6]/60 bg-[#FFFDF5]'
              }`}
            >
              <div className="flex items-center gap-2">
                {metric.isHealthy ? (
                  <CheckCircle className="h-4 w-4 text-[#00854D]" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-[#D17A00]" />
                )}
                <span className="text-sm text-[#323338]">{metric.label}</span>
              </div>
              <span className={`text-sm font-semibold number-display ${
                metric.isHealthy ? 'text-[#00854D]' : 'text-[#D17A00]'
              }`}>
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
