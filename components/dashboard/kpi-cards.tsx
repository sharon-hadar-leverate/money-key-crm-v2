'use client'

import Link from 'next/link'
import { Clock, PhoneCall, CalendarCheck, UserCheck, XCircle, Wallet, TrendingUp } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { LeadKPIs } from '@/types/leads'

interface KPICardsProps {
  kpis: LeadKPIs
}

// Static card configuration hoisted outside component (Vercel best practice: rendering-hoist-jsx)
const PIPELINE_CARDS = [
  {
    key: 'followUp',
    title: 'במעקב',
    kpiKey: 'followUpLeads' as const,
    icon: Clock,
    iconBg: 'bg-[#CCE5FF]',
    iconColor: 'text-[#0073EA]',
    href: '/leads?stage=follow_up',
  },
  {
    key: 'warm',
    title: 'חמים',
    kpiKey: 'warmLeads' as const,
    icon: PhoneCall,
    iconBg: 'bg-[#FFF0D6]',
    iconColor: 'text-[#D17A00]',
    href: '/leads?stage=warm',
  },
  {
    key: 'hot',
    title: 'חמים מאוד',
    kpiKey: 'hotLeads' as const,
    icon: CalendarCheck,
    iconBg: 'bg-[#FFEBE6]',
    iconColor: 'text-[#D93D42]',
    href: '/leads?stage=hot',
  },
  {
    key: 'signed',
    title: 'לקוחות',
    kpiKey: 'signedLeads' as const,
    icon: UserCheck,
    iconBg: 'bg-[#D4F4DD]',
    iconColor: 'text-[#00854D]',
    href: '/leads?stage=signed',
  },
  {
    key: 'lost',
    title: 'אבודים',
    kpiKey: 'allLostLeads' as const,
    icon: XCircle,
    iconBg: 'bg-[#FFD6D9]',
    iconColor: 'text-[#D83A52]',
    href: '/leads?stage=lost',
  },
  {
    key: 'conversion',
    title: 'אחוז המרה',
    kpiKey: 'conversionRate' as const,
    icon: TrendingUp,
    iconBg: 'bg-[#EDD9FB]',
    iconColor: 'text-[#9D5BD2]',
    isPercentage: true,
    href: '/leads?stage=signed',
  },
  {
    key: 'pipeline',
    title: 'הכנסה צפויה',
    kpiKey: 'weightedPipelineValue' as const,
    icon: Wallet,
    iconBg: 'bg-[#D4F4F7]',
    iconColor: 'text-[#00A0B0]',
    isCurrency: true,
    subtitleKey: 'totalPipelineValue' as const,
    href: '/leads',
  },
] as const

export function KPICards({ kpis }: KPICardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {PIPELINE_CARDS.map((card) => {
        const value = kpis[card.kpiKey]
        const Icon = card.icon
        const subtitle = 'subtitleKey' in card ? kpis[card.subtitleKey] : null
        const href = 'href' in card ? card.href : undefined

        const CardContent = (
          <>
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-3 rounded-lg ${card.iconBg} transition-transform group-hover:scale-105 duration-200`}
              >
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-[#676879] mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-[#323338] number-display">
                {'isCurrency' in card && card.isCurrency
                  ? formatCurrency(value)
                  : 'isPercentage' in card && card.isPercentage
                    ? `${value.toFixed(1)}%`
                    : formatNumber(value)}
              </p>
              {subtitle !== null && (
                <p className="text-xs text-[#9B9BAD] mt-1">
                  סה&quot;כ: {formatCurrency(subtitle)}
                </p>
              )}
            </div>
          </>
        )

        if (href) {
          return (
            <Link
              key={card.key}
              href={href}
              className="kpi-card group cursor-pointer block"
            >
              {CardContent}
            </Link>
          )
        }

        return (
          <div key={card.key} className="kpi-card group">
            {CardContent}
          </div>
        )
      })}
    </div>
  )
}
