import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { PlaybookGrid } from '@/components/playbooks'
import { getPlaybooks } from '@/actions/playbooks'
import { Plus } from 'lucide-react'

export default async function PlaybooksPage() {
  const playbooks = await getPlaybooks()

  return (
    <>
      <Header title="הדרכות" subtitle="ניהול מדריכי מכירות" />
      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-[#676879]">
              {playbooks.length > 0
                ? `${playbooks.length} הדרכות`
                : 'צרו את ההדרכה הראשונה שלכם'}
            </p>
          </div>
          <Link
            href="/playbooks/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#00A0B0] text-white font-medium hover:bg-[#008A99] transition-all text-sm"
          >
            <Plus className="h-4 w-4" />
            הדרכה חדשה
          </Link>
        </div>

        {/* Playbooks Grid */}
        <PlaybookGrid playbooks={playbooks} />
      </div>
    </>
  )
}
