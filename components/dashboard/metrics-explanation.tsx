'use client'

import { useState } from 'react'
import { Info, ChevronDown, ChevronUp, GitCommitHorizontal, TrendingUp, Wallet, CircleDollarSign, Receipt, Users, Target, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DataQualityResult } from '@/actions/kpis'

interface MetricsExplanationProps {
  qualityStats?: DataQualityResult
  isFiltered?: boolean
}

interface MetricExplanation {
  icon: React.ReactNode
  title: string
  basis: 'creation' | 'status_change'
  formula: string
  explanation: string
}

const METRIC_EXPLANATIONS: MetricExplanation[] = [
  {
    icon: <Users className="h-4 w-4 text-[#0073EA]" />,
    title: 'סה״כ לידים',
    basis: 'creation',
    formula: 'ספירת כל הלידים שנוצרו בטווח התאריכים',
    explanation: 'מבוסס על תאריך יצירת הליד. ליד שנוצר לפני חודש לא ייספר בתצוגת "השבוע" גם אם עדכנת אותו היום.',
  },
  {
    icon: <Target className="h-4 w-4 text-[#D17A00]" />,
    title: 'פעילים בצנרת',
    basis: 'creation',
    formula: 'לידים בשלב מעקב + חמים (מתוך לידים שנוצרו בתקופה)',
    explanation: 'סופר לידים שנוצרו בטווח התאריכים ונמצאים כרגע בסטטוס מעקב או חמים.',
  },
  {
    icon: <TrendingUp className="h-4 w-4 text-[#00854D]" />,
    title: 'אחוז המרה',
    basis: 'creation',
    formula: '(לידים בשלב סגירה ÷ סה״כ לידים שנוצרו) × 100',
    explanation: 'מתוך הלידים שנוצרו בתקופה הנבחרת, כמה אחוז הגיעו לשלב סגירה. מבוסס על הסטטוס הנוכחי של הלידים.',
  },
  {
    icon: <Wallet className="h-4 w-4 text-[#9D5BD2]" />,
    title: 'הכנסה צפויה',
    basis: 'status_change',
    formula: 'סכום (סכום החזר × אחוז עמלה) עבור לידים שהגיעו לשלב סגירה בתקופה',
    explanation: 'מבוסס על תאריך שינוי הסטטוס. ליד שנוצר לפני 3 חודשים אבל חתם על הסכם השבוע — ייספר בתצוגת "השבוע". כך אפשר לראות את ההכנסה האמיתית שנוצרה בתקופה.',
  },
  {
    icon: <CircleDollarSign className="h-4 w-4 text-[#00854D]" />,
    title: 'סכום נגבה',
    basis: 'status_change',
    formula: 'סכום (סכום החזר × אחוז עמלה) עבור לידים שהגיעו ל"גבייה הושלמה" בתקופה',
    explanation: 'מבוסס על תאריך שינוי הסטטוס ל"גבייה הושלמה". מראה כמה כסף נכנס בפועל בתקופה הנבחרת, ללא קשר למועד יצירת הליד.',
  },
  {
    icon: <Receipt className="h-4 w-4 text-[#0073EA]" />,
    title: 'סך הכל החזרים',
    basis: 'creation',
    formula: 'סכום שדה "סכום החזר" עבור לידים שנוצרו בתקופה',
    explanation: 'סכום ההחזרים של לידים שנוצרו בטווח התאריכים. מבוסס על תאריך יצירה.',
  },
  {
    icon: <BarChart3 className="h-4 w-4 text-[#0073EA]" />,
    title: 'גרף לידים לאורך זמן',
    basis: 'status_change',
    formula: 'לידים חדשים = לפי תאריך יצירה | סגירה = כל מעבר לשלב סגירה (כולל סטטוסים ישנים) | גבייה = → גבייה הושלמה',
    explanation: 'הגרף מציג שלושה נתונים: לידים חדשים (לפי תאריך יצירה), הגיעו לסגירה (כל מעבר מכל שלב לשלב סגירה — כולל סטטוסים ישנים כמו new, contacted, customer), וגבייה הושלמה (ליד שהגיע לסטטוס גבייה הושלמה). רק האירוע האחרון לכל ליד נספר בכל קטגוריה.',
  },
  {
    icon: <GitCommitHorizontal className="h-4 w-4 text-[#00A0B0]" />,
    title: 'מסע הליד (פילוח סטטוסים)',
    basis: 'status_change',
    formula: 'עבור כל ליד — הסטטוס האחרון שהשתנה בתקופה הנבחרת',
    explanation: 'כשמסננים לפי תאריכים, התצוגה מראה את שינוי הסטטוס האחרון של כל ליד בתקופה. ליד שהסטטוס שלו השתנה פעמיים בתקופה — ייספר לפי הסטטוס האחרון בלבד.',
  },
]

export function MetricsExplanation({ qualityStats, isFiltered }: MetricsExplanationProps) {
  const [isOpen, setIsOpen] = useState(false)

  const showCoverage = isFiltered && qualityStats
  const lowCoverage = showCoverage && qualityStats.eventCoverage < 0.8

  return (
    <div className="monday-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-5 py-3 text-right hover:bg-[#F5F6F8]/50 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F0E6FF] to-[#E0D0F5] flex items-center justify-center shrink-0">
          <Info className="h-4 w-4 text-[#9D5BD2]" />
        </div>
        <div className="flex-1">
          <span className="text-sm font-semibold text-[#323338]">איך מחושבים המדדים?</span>
        </div>
        {showCoverage && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
            lowCoverage ? 'bg-[#FFF0D6] text-[#D17A00]' : 'bg-[#D4F4DD] text-[#00854D]'
          }`}>
            כיסוי אירועים: {Math.round(qualityStats.eventCoverage * 100)}% — {qualityStats.leadsWithEvents} מתוך {qualityStats.totalLeadsInWindow} לידים
          </span>
        )}
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-[#9B9BAD]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#9B9BAD]" />
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-1">
          {/* Legend */}
          <div className="flex gap-4 mb-4 px-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#0073EA]" />
              <span className="text-xs text-[#676879]">לפי תאריך יצירה</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#9D5BD2]" />
              <span className="text-xs text-[#676879]">לפי תאריך שינוי סטטוס</span>
            </div>
          </div>

          {METRIC_EXPLANATIONS.map((metric) => (
            <div
              key={metric.title}
              className={cn(
                "rounded-xl border px-4 py-3",
                metric.basis === 'creation'
                  ? "border-[#CCE5FF]/60 bg-[#F5FAFF]"
                  : lowCoverage && metric.basis === 'status_change'
                    ? "border-[#FFF0D6]/60 bg-[#FFFDF5]"
                    : "border-[#EDD9FB]/60 bg-[#FBF6FF]"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                {metric.icon}
                <span className="text-sm font-semibold text-[#323338]">{metric.title}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-medium",
                  metric.basis === 'creation'
                    ? "bg-[#CCE5FF] text-[#0073EA]"
                    : "bg-[#EDD9FB] text-[#9D5BD2]"
                )}>
                  {metric.basis === 'creation' ? 'תאריך יצירה' : 'תאריך שינוי סטטוס'}
                </span>
                {lowCoverage && metric.basis === 'status_change' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#FFF0D6] text-[#D17A00]">
                    כיסוי חלקי
                  </span>
                )}
              </div>
              <p className="text-xs text-[#676879] font-mono mb-1" dir="rtl">{metric.formula}</p>
              <p className="text-xs text-[#9B9BAD] leading-relaxed">{metric.explanation}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
