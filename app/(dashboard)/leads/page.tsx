import { Header } from '@/components/layout/header'
import { LeadsTable } from '@/components/leads/leads-table'
import { getLeads } from '@/actions/leads'
import { getNoteCountsForLeads } from '@/actions/notes'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import type { PipelineStage } from '@/types/leads'

interface LeadsPageProps {
  searchParams: Promise<{ stage?: string }>
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams
  const { data: leads, count } = await getLeads({ limit: 100 })
  const initialStage = params.stage as PipelineStage | undefined

  // Fetch note counts for all leads in parallel with efficient batch query
  const leadIds = leads.map(lead => lead.id)
  const noteCountsMap = await getNoteCountsForLeads(leadIds)

  // Convert Map to a plain object for passing to client component
  const noteCounts: Record<string, number> = {}
  noteCountsMap.forEach((count, leadId) => {
    noteCounts[leadId] = count
  })

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
        <LeadsTable
          leads={leads}
          totalCount={count}
          initialStage={initialStage}
          noteCounts={noteCounts}
        />
      </div>
    </>
  )
}
