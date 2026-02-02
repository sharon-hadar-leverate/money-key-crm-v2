'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateTaskDialog } from '@/components/tasks'

export function TasksPageClient() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsCreateOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00A0B0] rounded-lg hover:bg-[#008090] transition-colors"
      >
        <Plus className="h-4 w-4" />
        משימה חדשה
      </button>

      <CreateTaskDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </>
  )
}
