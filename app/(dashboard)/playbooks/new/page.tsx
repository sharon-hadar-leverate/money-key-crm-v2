import { Header } from '@/components/layout/header'
import { PlaybookForm } from '@/components/playbooks'

export default function NewPlaybookPage() {
  return (
    <>
      <Header title="הדרכה חדשה" subtitle="יצירת מדריך מכירות חדש" />
      <div className="p-6">
        <PlaybookForm mode="create" />
      </div>
    </>
  )
}
