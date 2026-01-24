'use client'

import { Globe } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { SourcePerformance } from '@/actions/kpis'

interface SourcePerformanceTableProps {
  data: SourcePerformance[]
}

export function SourcePerformanceTable({ data }: SourcePerformanceTableProps) {
  const maxLeads = Math.max(...data.map(d => d.leads), 1)
  const totalLeads = data.reduce((sum, d) => sum + d.leads, 0)

  return (
    <div className="monday-card overflow-hidden">
      {/* Header */}
      <div className="widget-header">
        <div className="widget-header-icon bg-gradient-to-br from-[#EDD9FB] to-[#DCC4F0]">
          <Globe className="h-5 w-5 text-[#9D5BD2]" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h3 className="widget-title">ביצועי מקורות</h3>
          <p className="widget-subtitle">UTM Source & המרות</p>
        </div>
        <div className="text-left">
          <p className="text-xs text-[#9B9BAD]">סה״כ</p>
          <p className="text-lg font-bold text-[#1a1d23] number-display">{totalLeads}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gradient-to-r from-[#F8F9FA] to-[#F5F6F8]">
              <th className="text-right px-5 py-3.5 font-semibold text-[#676879] text-xs uppercase tracking-wide">מקור</th>
              <th className="text-center px-3 py-3.5 font-semibold text-[#676879] text-xs uppercase tracking-wide">לידים</th>
              <th className="text-center px-3 py-3.5 font-semibold text-[#676879] text-xs uppercase tracking-wide">המרה</th>
              <th className="text-center px-3 py-3.5 font-semibold text-[#676879] text-xs uppercase tracking-wide">הכנסה</th>
              <th className="text-center px-3 py-3.5 font-semibold text-[#676879] text-xs uppercase tracking-wide">ממוצע</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-[#9B9BAD]">
                  <Globe className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>אין נתונים להצגה</p>
                </td>
              </tr>
            ) : (
              data.slice(0, 8).map((row, index) => (
                <tr
                  key={row.source}
                  className="border-b border-[#E6E9EF]/50 hover:bg-gradient-to-r hover:from-[#EDD9FB]/10 hover:to-transparent transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#EDD9FB] text-[#9D5BD2] text-xs font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1a1d23] truncate">{row.source}</p>
                        <div className="mt-1.5 h-1.5 bg-[#E6E9EF] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#9D5BD2] to-[#B47DE0] rounded-full transition-all duration-500"
                            style={{ width: `${(row.leads / maxLeads) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span className="font-bold text-[#1a1d23] number-display text-base">{row.leads}</span>
                  </td>
                  <td className="px-3 py-4 text-center">
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
                  <td className="px-3 py-4 text-center">
                    <span className="font-semibold text-[#323338] number-display">{formatCurrency(row.revenue)}</span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span className="text-[#676879] number-display text-sm">
                      {row.avgDealSize > 0 ? formatCurrency(row.avgDealSize) : '-'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
