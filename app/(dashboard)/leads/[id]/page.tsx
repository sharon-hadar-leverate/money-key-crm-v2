import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { LeadDetail } from '@/components/leads/lead-detail'
import { getLeadWithEvents, markLeadAsSeen } from '@/actions/leads'
import { getNotes } from '@/actions/notes'
import { getPlaybooks, getPlaybookForLead, getDefaultPlaybook } from '@/actions/playbooks'
import { ArrowRight } from 'lucide-react'

interface LeadPageProps {
  params: Promise<{ id: string }>
}

export default async function LeadPage({ params }: LeadPageProps) {
  const { id } = await params

  // Fetch lead data, notes, and playbooks in parallel
  const [result, notes, playbooks, currentPlaybook, defaultPlaybook] = await Promise.all([
    getLeadWithEvents(id),
    getNotes(id),
    getPlaybooks(),
    getPlaybookForLead(id),
    getDefaultPlaybook(),
  ])

  if (!result) {
    notFound()
  }

  // Mark lead as seen (fire-and-forget, non-blocking)
  if (result.lead.is_new) {
    void markLeadAsSeen(id)
  }

  return (
    <>
      <Header title={result.lead.name} subtitle="פרטי ליד" />
      <div className="p-6">
        <div className="mb-6">
          <Link
            href="/leads"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#E6E9EF] text-[#676879] hover:text-[#323338] hover:border-[#00A0B0] transition-all text-sm"
          >
            <ArrowRight className="h-4 w-4" />
            חזרה ללידים
          </Link>
        </div>
        <LeadDetail
          lead={result.lead}
          events={result.events}
          notes={notes}
          playbooks={playbooks}
          currentPlaybook={currentPlaybook}
          defaultPlaybookId={defaultPlaybook?.id ?? null}
        />
      </div>
    </>
  )
}
