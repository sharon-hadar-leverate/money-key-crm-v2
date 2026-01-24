import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { PlaybookForm } from '@/components/playbooks'
import { getPlaybook } from '@/actions/playbooks'

interface EditPlaybookPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPlaybookPage({ params }: EditPlaybookPageProps) {
  const { id } = await params
  const playbook = await getPlaybook(id)

  if (!playbook) {
    notFound()
  }

  return (
    <>
      <Header title={playbook.name} subtitle="עריכת הדרכה" />
      <div className="p-6">
        <PlaybookForm mode="edit" playbook={playbook} />
      </div>
    </>
  )
}
