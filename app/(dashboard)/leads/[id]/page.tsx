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
      <Header title={result.lead.name} subtitle="פרטי ליד" backHref="/leads" />
      <div className="p-6">
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
