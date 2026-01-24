'use client'

import { Users, TrendingUp, Wallet, Target } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { LeadKPIs } from '@/types/leads'

interface KPICardsProps {
  kpis: LeadKPIs
}

export function KPICards({ kpis }: KPICardsProps) {
  const activeLeads = kpis.followUpLeads + kpis.warmLeads + kpis.hotLeads

  return (
    <div className="monday-card p-4">
      <div className="flex items-center justify-between gap-6 flex-wrap">
        {/* Total Leads */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#CCE5FF] to-[#B3D6FF] flex items-center justify-center">
            <Users className="h-6 w-6 text-[#0073EA]" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs text-[#9B9BAD] font-medium">סה״כ לידים</p>
            <p className="text-2xl font-bold text-[#1a1d23] number-display">{formatNumber(kpis.totalLeads)}</p>
          </div>
        </div>

        <div className="h-10 w-px bg-[#E6E9EF]" />

        {/* Active Pipeline */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFF0D6] to-[#FFE4B8] flex items-center justify-center">
            <Target className="h-6 w-6 text-[#D17A00]" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs text-[#9B9BAD] font-medium">פעילים בצנרת</p>
            <p className="text-2xl font-bold text-[#D17A00] number-display">{formatNumber(activeLeads)}</p>
          </div>
        </div>

        <div className="h-10 w-px bg-[#E6E9EF]" />

        {/* Conversion Rate */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4F4DD] to-[#B8E8C4] flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-[#00854D]" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs text-[#9B9BAD] font-medium">אחוז המרה</p>
            <p className="text-2xl font-bold text-[#00854D] number-display">{kpis.conversionRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="h-10 w-px bg-[#E6E9EF]" />

        {/* Expected Revenue */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EDD9FB] to-[#DCC4F0] flex items-center justify-center">
            <Wallet className="h-6 w-6 text-[#9D5BD2]" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs text-[#9B9BAD] font-medium">הכנסה צפויה</p>
            <p className="text-2xl font-bold text-[#9D5BD2] number-display">{formatCurrency(kpis.weightedPipelineValue)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
