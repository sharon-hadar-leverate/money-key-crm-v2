'use client'

import { useState } from 'react'
import { PlaybookCard } from './playbook-card'
import { deletePlaybook } from '@/actions/playbooks'
import { toast } from 'sonner'
import type { Playbook } from '@/types/playbooks'

interface PlaybookGridProps {
  playbooks: Playbook[]
}

export function PlaybookGrid({ playbooks: initialPlaybooks }: PlaybookGridProps) {
  const [playbooks, setPlaybooks] = useState(initialPlaybooks)

  const handleDelete = async (id: string) => {
    const playbook = playbooks.find(p => p.id === id)
    if (!playbook) return

    if (playbook.is_default) {
      toast.error('לא ניתן למחוק הדרכת ברירת מחדל')
      return
    }

    const confirmed = window.confirm(`האם למחוק את ההדרכה "${playbook.name}"?`)
    if (!confirmed) return

    const result = await deletePlaybook(id)
    if (result.success) {
      setPlaybooks(prev => prev.filter(p => p.id !== id))
      toast.success('ההדרכה נמחקה בהצלחה')
    } else {
      toast.error(result.error || 'שגיאה במחיקת ההדרכה')
    }
  }

  if (playbooks.length === 0) {
    return (
      <div className="monday-card p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F5F6F8] flex items-center justify-center">
          <svg className="h-8 w-8 text-[#9B9BAD]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#323338] mb-2">אין הדרכות עדיין</h3>
        <p className="text-sm text-[#676879]">צרו את ההדרכה הראשונה שלכם כדי לעזור לצוות המכירות</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {playbooks.map(playbook => (
        <PlaybookCard
          key={playbook.id}
          playbook={playbook}
          onDelete={handleDelete}
        />
      ))}
    </div>
  )
}
