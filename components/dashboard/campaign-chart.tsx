'use client'

import { Target } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { CampaignPerformance } from '@/actions/kpis'

interface CampaignChartProps {
  data: CampaignPerformance[]
}

export function CampaignChart({ data }: CampaignChartProps) {
  const maxLeads = Math.max(...data.map(d => d.leads), 1)
  const totalLeads = data.reduce((sum, d) => sum + d.leads, 0)

  if (data.length === 0) {
    return (
      <div className="monday-card overflow-hidden">
        <div className="widget-header">
          <div className="widget-header-icon bg-gradient-to-br from-[#FFF0D6] to-[#FFE4B8]">
            <Target className="h-5 w-5 text-[#D17A00]" strokeWidth={2} />
          </div>
          <div>
            <h3 className="widget-title">קמפיינים</h3>
            <p className="widget-subtitle">UTM Campaign</p>
          </div>
        </div>
        <div className="p-12 text-center text-[#9B9BAD]">
          <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>אין נתוני קמפיינים</p>
        </div>
      </div>
    )
  }

  return (
    <div className="monday-card overflow-hidden">
      {/* Header */}
      <div className="widget-header">
        <div className="widget-header-icon bg-gradient-to-br from-[#FFF0D6] to-[#FFE4B8]">
          <Target className="h-5 w-5 text-[#D17A00]" strokeWidth={2} />
        </div>
        <div className="flex-1">
          <h3 className="widget-title">קמפיינים</h3>
          <p className="widget-subtitle">Top 10 לפי UTM Campaign</p>
        </div>
        <div className="text-left">
          <p className="text-xs text-[#9B9BAD]">סה״כ</p>
          <p className="text-lg font-bold text-[#1a1d23] number-display">{totalLeads}</p>
        </div>
      </div>

      <div className="p-5 space-y-4 max-h-[350px] overflow-y-auto">
        {data.map((campaign, index) => (
          <div
            key={campaign.campaign}
            className="group p-3 rounded-xl hover:bg-gradient-to-r hover:from-[#FFF0D6]/30 hover:to-transparent transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FFF0D6] text-[#D17A00] text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-[#1a1d23] truncate" title={campaign.campaign}>
                  {campaign.campaign}
                </span>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`badge-pro ${
                  campaign.conversionRate >= 20
                    ? 'bg-[#D4F4DD] text-[#00854D]'
                    : campaign.conversionRate >= 10
                      ? 'bg-[#FFF0D6] text-[#D17A00]'
                      : 'bg-[#F5F6F8] text-[#676879]'
                }`}>
                  {campaign.conversionRate.toFixed(0)}%
                </span>
                <span className="text-base font-bold text-[#1a1d23] number-display min-w-[32px] text-left">
                  {campaign.leads}
                </span>
              </div>
            </div>
            <div className="h-2 bg-[#F5F6F8] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#D17A00] to-[#E8943D] rounded-full transition-all duration-500"
                style={{ width: `${(campaign.leads / maxLeads) * 100}%` }}
              />
            </div>
            {campaign.revenue > 0 && (
              <div className="mt-2 text-xs text-[#676879] text-left">
                הכנסה: <span className="font-semibold number-display">{formatCurrency(campaign.revenue)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
