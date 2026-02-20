'use client'

import { Clock, AlertTriangle } from 'lucide-react'
import type { VelocityMetric } from '@/actions/kpis'

interface PipelineVelocityProps {
  data: VelocityMetric[]
}

export function PipelineVelocity({ data }: PipelineVelocityProps) {
  if (data.length === 0) return null

  return (
    <div className="monday-card overflow-hidden">
      <div className="widget-header">
        <div className="widget-header-icon bg-gradient-to-br from-[#D4F4F7] to-[#B8E8EC]">
          <Clock className="h-5 w-5 text-[#00A0B0]" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h3 className="widget-title">מהירות צנרת</h3>
          <p className="widget-subtitle">ממוצע ימים בין שלבים</p>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-3 gap-4">
          {data.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-[#E6E9EF] p-4 text-center"
            >
              <p className="text-xs text-[#676879] font-medium mb-2">{metric.labelHe}</p>
              <p className="text-2xl font-bold text-[#323338] number-display">
                {metric.avgDays > 0 ? `${metric.avgDays}` : '-'}
              </p>
              <p className="text-[10px] text-[#9B9BAD] mt-1">ימים</p>
              <div className="mt-2 flex items-center justify-center gap-1">
                {!metric.isReliable && metric.sampleSize > 0 && (
                  <AlertTriangle className="h-3 w-3 text-[#D17A00]" />
                )}
                <span className={`text-[10px] ${metric.isReliable ? 'text-[#9B9BAD]' : 'text-[#D17A00]'}`}>
                  n={metric.sampleSize}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
