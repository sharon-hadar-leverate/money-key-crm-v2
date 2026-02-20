'use client'

import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { he } from 'date-fns/locale'
import { STATUS_CONFIG } from '@/types/leads'
import type { LeadStatus } from '@/types/leads'
import type { TrendTransaction } from '@/actions/kpis'

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as LeadStatus]
  if (!config) {
    return <span className="text-xs text-[#676879]">{status}</span>
  }
  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ backgroundColor: config.bgColor, color: config.color, border: `1px solid ${config.borderColor}` }}
    >
      {config.label}
    </span>
  )
}

interface Props {
  transactions: TrendTransaction[]
}

export function TrendTransactionsTable({ transactions }: Props) {
  return (
    <div className="max-h-[300px] overflow-y-auto rounded-lg border border-[#E6E9EF]">
      <table className="w-full text-sm" dir="rtl">
        <thead className="bg-[#F5F6F8] sticky top-0">
          <tr>
            <th className="text-right px-3 py-2 text-xs font-medium text-[#676879]">שם הליד</th>
            <th className="text-right px-3 py-2 text-xs font-medium text-[#676879]">מסטטוס</th>
            <th className="text-right px-3 py-2 text-xs font-medium text-[#676879]">לסטטוס</th>
            <th className="text-right px-3 py-2 text-xs font-medium text-[#676879]">תאריך</th>
            <th className="text-right px-3 py-2 text-xs font-medium text-[#676879]">סוג</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, i) => (
            <tr key={`${tx.lead_id}-${tx.type}-${i}`} className="border-t border-[#E6E9EF] hover:bg-[#F5F6F8]/50">
              <td className="px-3 py-2">
                <Link
                  href={`/leads/${tx.lead_id}`}
                  className="text-[#0073EA] hover:underline font-medium text-xs"
                >
                  {tx.lead_name}
                </Link>
              </td>
              <td className="px-3 py-2">
                <StatusBadge status={tx.old_value} />
              </td>
              <td className="px-3 py-2">
                <StatusBadge status={tx.new_value} />
              </td>
              <td className="px-3 py-2 text-xs text-[#676879]">
                {format(parseISO(tx.created_at), 'd/M/yy HH:mm', { locale: he })}
              </td>
              <td className="px-3 py-2">
                {tx.type === 'sale' ? (
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#D4F4DD] text-[#00854D]">
                    סגירה
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FFF3E0] text-[#D17A00]">
                    גבייה
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
