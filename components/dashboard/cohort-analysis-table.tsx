'use client'

import { Users } from 'lucide-react'
import type { CohortRow } from '@/actions/kpis'

interface CohortAnalysisTableProps {
  data: CohortRow[]
}

const STAGE_LABELS: Record<string, string> = {
  follow_up: 'מעקב',
  warm: 'חמים',
  signed: 'סגירה',
  exit: 'יציאה',
  future: 'עתידי',
}

export function CohortAnalysisTable({ data }: CohortAnalysisTableProps) {
  if (data.length === 0) return null

  return (
    <div className="monday-card overflow-hidden">
      <div className="widget-header">
        <div className="widget-header-icon bg-gradient-to-br from-[#CCE5FF] to-[#B3D6FF]">
          <Users className="h-5 w-5 text-[#0073EA]" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h3 className="widget-title">ניתוח קוהורטות</h3>
          <p className="widget-subtitle">לידים לפי חודש יצירה ושלב נוכחי</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[#F8F9FA] to-[#F5F6F8]">
              <th className="text-right px-4 py-3 font-semibold text-[#676879] text-xs uppercase tracking-wide">חודש</th>
              <th className="text-center px-3 py-3 font-semibold text-[#676879] text-xs uppercase tracking-wide">סה״כ</th>
              {Object.entries(STAGE_LABELS).map(([key, label]) => (
                <th key={key} className="text-center px-3 py-3 font-semibold text-[#676879] text-xs uppercase tracking-wide">{label}</th>
              ))}
              <th className="text-center px-3 py-3 font-semibold text-[#676879] text-xs uppercase tracking-wide">% המרה</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.cohortMonth} className="border-b border-[#E6E9EF]/50 hover:bg-[#F5F6F8]/50 transition-colors">
                <td className="px-4 py-3 font-medium text-[#323338]">{row.cohortMonth}</td>
                <td className="px-3 py-3 text-center font-bold text-[#1a1d23] number-display">{row.total}</td>
                <td className="px-3 py-3 text-center number-display text-[#0073EA]">{row.follow_up || '-'}</td>
                <td className="px-3 py-3 text-center number-display text-[#D17A00]">{row.warm || '-'}</td>
                <td className={`px-3 py-3 text-center number-display font-semibold ${row.signed > 0 ? 'text-[#00854D] bg-[#D4F4DD]/30' : 'text-[#9B9BAD]'}`}>
                  {row.signed || '-'}
                </td>
                <td className="px-3 py-3 text-center number-display text-[#D83A52]">{row.exit || '-'}</td>
                <td className="px-3 py-3 text-center number-display text-[#00A0B0]">{row.future || '-'}</td>
                <td className="px-3 py-3 text-center">
                  <span className={`badge-pro ${
                    row.conversionRate >= 20
                      ? 'bg-[#D4F4DD] text-[#00854D]'
                      : row.conversionRate >= 10
                        ? 'bg-[#FFF0D6] text-[#D17A00]'
                        : 'bg-[#F5F6F8] text-[#676879]'
                  }`}>
                    {row.conversionRate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
