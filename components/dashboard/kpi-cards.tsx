'use client'

import { Users, UserCheck, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { LeadKPIs } from '@/types/leads'

interface KPICardsProps {
  kpis: LeadKPIs
}

export function KPICards({ kpis }: KPICardsProps) {
  const cards = [
    {
      title: 'לידים חדשים',
      value: formatNumber(kpis.newLeads),
      icon: Users,
      trend: '+12%',
      trendUp: true,
      iconBg: 'bg-[#CCE5FF]',
      iconColor: 'text-[#0073EA]',
    },
    {
      title: 'נוצר קשר',
      value: formatNumber(kpis.contactedLeads),
      icon: TrendingUp,
      trend: '+8%',
      trendUp: true,
      iconBg: 'bg-[#FFF0D6]',
      iconColor: 'text-[#D17A00]',
    },
    {
      title: 'לקוחות',
      value: formatNumber(kpis.customers),
      icon: UserCheck,
      trend: '+23%',
      trendUp: true,
      iconBg: 'bg-[#D4F4DD]',
      iconColor: 'text-[#00854D]',
    },
    {
      title: 'הכנסה צפויה',
      value: formatCurrency(kpis.weightedPipelineValue),
      icon: Wallet,
      trend: '-3%',
      trendUp: false,
      subtitle: `סה"כ: ${formatCurrency(kpis.totalPipelineValue)}`,
      iconBg: 'bg-[#EDD9FB]',
      iconColor: 'text-[#9D5BD2]',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="kpi-card group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg ${card.iconBg} transition-transform group-hover:scale-105 duration-200`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>

            {/* Trend indicator */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
              card.trendUp
                ? 'bg-[#D4F4DD] text-[#00854D]'
                : 'bg-[#FFD6D9] text-[#D83A52]'
            }`}>
              {card.trendUp ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {card.trend}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-[#676879] mb-1">
              {card.title}
            </p>
            <p className="text-2xl font-bold text-[#323338] number-display">
              {card.value}
            </p>
            {card.subtitle && (
              <p className="text-xs text-[#9B9BAD] mt-1">
                {card.subtitle}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
