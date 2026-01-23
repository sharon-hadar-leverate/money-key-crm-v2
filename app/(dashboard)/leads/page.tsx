import { Header } from '@/components/layout/header'
import { LeadsTable } from '@/components/leads/leads-table'
import { getLeads } from '@/actions/leads'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function LeadsPage() {
  const { data: leads, count } = await getLeads({ limit: 100 })

  return (
    <>
      <Header title="לידים" subtitle="ניהול וצפייה בלידים" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#323338]">כל הלידים</h2>
          <Link
            href="/leads/new"
            className="btn-monday"
          >
            <Plus className="h-4 w-4" />
            ליד חדש
          </Link>
        </div>
        <LeadsTable leads={leads} totalCount={count} />
      </div>
    </>
  )
}
