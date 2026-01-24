'use client'

import { useState, useEffect, useTransition } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlaybookViewer } from './playbook-viewer'
import { PlaybookSelector } from './playbook-selector'
import { setLeadPlaybook } from '@/actions/playbooks'
import { toast } from 'sonner'
import type { Playbook } from '@/types/playbooks'

interface PlaybookPanelProps {
  leadId: string
  playbooks: Playbook[]
  currentPlaybook: Playbook | null
  currentPlaybookId: string | null
  defaultPlaybookId: string | null
}

export function PlaybookPanel({
  leadId,
  playbooks,
  currentPlaybook,
  currentPlaybookId,
  defaultPlaybookId,
}: PlaybookPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(currentPlaybookId)
  const [displayedPlaybook, setDisplayedPlaybook] = useState<Playbook | null>(currentPlaybook)
  const [isPending, startTransition] = useTransition()

  // Update displayed playbook when selection changes
  useEffect(() => {
    if (selectedId) {
      const playbook = playbooks.find(p => p.id === selectedId)
      if (playbook) setDisplayedPlaybook(playbook)
    } else {
      // Fall back to default
      const defaultPlaybook = playbooks.find(p => p.id === defaultPlaybookId)
      setDisplayedPlaybook(defaultPlaybook || null)
    }
  }, [selectedId, playbooks, defaultPlaybookId])

  const handlePlaybookChange = (playbookId: string | null) => {
    setSelectedId(playbookId)

    startTransition(async () => {
      const result = await setLeadPlaybook(leadId, playbookId)
      if (!result.success) {
        toast.error('שגיאה בשמירת ההדרכה')
        // Revert on error
        setSelectedId(currentPlaybookId)
      }
    })
  }

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out shrink-0',
        isCollapsed ? 'w-12' : 'w-80'
      )}
    >
      <div className="monday-card h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#E6E9EF] flex items-center justify-between bg-[#F9FAFB]">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#E5F6F7]">
                <BookOpen className="h-4 w-4 text-[#00A0B0]" />
              </div>
              <span className="font-medium text-[#323338] text-sm">הדרכה</span>
              {isPending && (
                <RefreshCw className="h-3.5 w-3.5 text-[#9B9BAD] animate-spin" />
              )}
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-[#E6E9EF] transition-colors"
            title={isCollapsed ? 'הרחב' : 'צמצם'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-[#676879]" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-[#676879]" />
            )}
          </button>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Selector */}
            <div className="p-3 border-b border-[#E6E9EF]">
              <PlaybookSelector
                playbooks={playbooks}
                selectedId={selectedId}
                defaultPlaybookId={defaultPlaybookId}
                onChange={handlePlaybookChange}
                disabled={isPending}
              />
            </div>

            {/* Playbook Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {displayedPlaybook ? (
                <PlaybookViewer content={displayedPlaybook.content} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-[#F5F6F8] flex items-center justify-center mb-3">
                    <BookOpen className="h-6 w-6 text-[#9B9BAD]" />
                  </div>
                  <p className="text-sm text-[#9B9BAD]">אין הדרכה מוגדרת</p>
                  <p className="text-xs text-[#C4C4C4] mt-1">בחרו הדרכה מהרשימה</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collapsed State Icon */}
        {isCollapsed && (
          <div className="flex-1 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-[#9B9BAD]" />
          </div>
        )}
      </div>
    </div>
  )
}
