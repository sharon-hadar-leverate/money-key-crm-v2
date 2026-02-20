'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { TrendingUp, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import type { DailyTrendsResult } from '@/actions/kpis'
import { TrendTransactionsTable } from './trend-transactions-table'

interface LeadsTrendChartProps {
  data: DailyTrendsResult
  totalSignedLeads?: number
}

function ChartSkeleton() {
  return (
    <div className="h-[200px] bg-[#F5F6F8] rounded animate-pulse" />
  )
}

const DynamicChart = dynamic(
  () => import('./leads-trend-chart-inner'),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export function LeadsTrendChart({ data, totalSignedLeads }: LeadsTrendChartProps) {
  const [showTransactions, setShowTransactions] = useState(false)

  const totalLeads = data.trends.reduce((sum, d) => sum + d.total, 0)
  const totalConverted = data.trends.reduce((sum, d) => sum + d.converted, 0)
  const totalPayments = data.trends.reduce((sum, d) => sum + d.paymentCompleted, 0)

  // Show warning when event-based converted count is < 30% of actual signed leads
  const showConversionWarning = totalSignedLeads != null && totalSignedLeads > 0 &&
    totalConverted < totalSignedLeads * 0.3

  return (
    <div className="monday-card overflow-hidden">
      <div className="widget-header">
        <div className="widget-header-icon bg-gradient-to-br from-[#CCE5FF] to-[#B3D6FF]">
          <TrendingUp className="h-5 w-5 text-[#0073EA]" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h3 className="widget-title">לידים לאורך זמן</h3>
          <p className="widget-subtitle">30 ימים אחרונים</p>
        </div>
        <div className="flex gap-6">
          <div className="text-left px-4 py-2 rounded-xl bg-[#F5F6F8]/80" title="לפי תאריך יצירה">
            <p className="text-[#9B9BAD] text-[10px] uppercase tracking-wide font-medium">לידים חדשים</p>
            <p className="text-xl font-bold text-[#1a1d23] number-display">{totalLeads}</p>
          </div>
          <div className="text-left px-4 py-2 rounded-xl bg-[#D4F4DD]/50" title="מעקב/חמים → סגירה">
            <p className="text-[#9B9BAD] text-[10px] uppercase tracking-wide font-medium">הגיעו לסגירה</p>
            <p className="text-xl font-bold text-[#00854D] number-display">{totalConverted}</p>
          </div>
          <div className="text-left px-4 py-2 rounded-xl bg-[#FFF3E0]/60" title="גבייה הושלמה">
            <p className="text-[#9B9BAD] text-[10px] uppercase tracking-wide font-medium">גבייה הושלמה</p>
            <p className="text-xl font-bold text-[#D17A00] number-display">{totalPayments}</p>
          </div>
        </div>
      </div>
      {showConversionWarning && (
        <div className="mx-5 mt-2 mb-0 flex items-center gap-2 rounded-lg bg-[#FFF0D6] border border-[#FFE4B8] px-3 py-2">
          <AlertTriangle className="h-4 w-4 text-[#D17A00] shrink-0" />
          <p className="text-xs text-[#D17A00]">
            מספר הגיעו לסגירה ({totalConverted}) נמוך מהמצופה — בפועל {totalSignedLeads} לידים בשלב סגירה
          </p>
        </div>
      )}
      <div className="p-5 h-[220px]">
        <DynamicChart data={data.trends} />
      </div>

      {/* Collapsible transactions section */}
      {data.transactions.length > 0 && (
        <div className="border-t border-[#E6E9EF]">
          <button
            onClick={() => setShowTransactions(!showTransactions)}
            className="w-full flex items-center gap-2 px-5 py-3 text-right hover:bg-[#F5F6F8]/50 transition-colors"
          >
            <span className="text-sm font-medium text-[#323338]">
              פירוט עסקאות ({data.transactions.length})
            </span>
            {showTransactions ? (
              <ChevronUp className="h-4 w-4 text-[#9B9BAD]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#9B9BAD]" />
            )}
          </button>
          {showTransactions && (
            <div className="px-5 pb-5">
              <TrendTransactionsTable transactions={data.transactions} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
