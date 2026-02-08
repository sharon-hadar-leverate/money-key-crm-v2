import { Header } from '@/components/layout/header'
import { CreateLeadForm } from '@/components/leads/create-lead-form'

export default function NewLeadPage() {
  return (
    <>
      <Header title="ליד חדש" backHref="/leads" />
      <div className="p-6">
        <CreateLeadForm />
      </div>
    </>
  )
}
