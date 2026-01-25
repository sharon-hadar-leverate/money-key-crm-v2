'use client'

import { useState, useEffect, useTransition } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, RefreshCw, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlaybookViewer } from './playbook-viewer'
import { PlaybookSelector } from './playbook-selector'
import { setLeadPlaybook } from '@/actions/playbooks'
import { toast } from 'sonner'
import type { Playbook } from '@/types/playbooks'
import type { NoteWithUser } from '@/actions/notes'
import { NotesSection } from '../leads/notes-section'

interface PlaybookPanelProps {
  leadId: string
  playbooks: Playbook[]
  currentPlaybook: Playbook | null
  currentPlaybookId: string | null
  defaultPlaybookId: string | null
  initialNotes?: NoteWithUser[]
}

export function PlaybookPanel({
  leadId,
  playbooks,
  currentPlaybook,
  currentPlaybookId,
  defaultPlaybookId,
  initialNotes = [],
}: PlaybookPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialNotes.length === 0)
  const [activeTab, setActiveTab] = useState<'playbook' | 'notes'>(initialNotes.length > 0 ? 'notes' : 'playbook')
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
        {/* Header/Tabs */}
        <div className="border-b border-[#E6E9EF] bg-[#F9FAFB]">
          <div className="px-2 pt-2 flex items-center justify-between">
            {!isCollapsed ? (
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab('notes')}
                  className={cn(
                    "px-3 py-2 text-xs font-medium rounded-t-lg transition-all flex items-center gap-2",
                    activeTab === 'notes'
                      ? "bg-white border-x border-t border-[#E6E9EF] text-[#00A0B0]"
                      : "text-[#676879] hover:bg-[#E6E9EF]/50"
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  הערות
                </button>
                <button
                  onClick={() => setActiveTab('playbook')}
                  className={cn(
                    "px-3 py-2 text-xs font-medium rounded-t-lg transition-all flex items-center gap-2",
                    activeTab === 'playbook'
                      ? "bg-white border-x border-t border-[#E6E9EF] text-[#00A0B0]"
                      : "text-[#676879] hover:bg-[#E6E9EF]/50"
                  )}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  הדרכה
                </button>
              </div>
            ) : (
              <div className="w-full flex justify-center py-2">
                {isPending && <RefreshCw className="h-3.5 w-3.5 text-[#9B9BAD] animate-spin" />}
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 mb-1 rounded-lg hover:bg-[#E6E9EF] transition-colors"
              title={isCollapsed ? 'הרחב' : 'צמצם'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-[#676879]" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-[#676879]" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        {!isCollapsed && (
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            {activeTab === 'playbook' ? (
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
            ) : (
              <div className="flex-1 overflow-y-auto">
                <NotesSection leadId={leadId} initialNotes={initialNotes} isEmbedded />
              </div>
            )}
          </div>
        )}

        {/* Collapsed State Icon & Label */}
        {isCollapsed && (
          <div className="flex-1 flex flex-col items-center py-4 gap-4">
            <button 
              onClick={() => { setIsCollapsed(false); setActiveTab('notes'); }}
              className="p-2 rounded-lg bg-[#FDEBDC] hover:bg-[#FDEBDC]/80 transition-colors"
            >
              <MessageSquare className="h-5 w-5 text-[#E07239]" />
            </button>
            <button 
              onClick={() => { setIsCollapsed(false); setActiveTab('playbook'); }}
              className="p-2 rounded-lg bg-[#E5F6F7] hover:bg-[#E5F6F7]/80 transition-colors"
            >
              <BookOpen className="h-5 w-5 text-[#00A0B0]" />
            </button>
            <div className="flex flex-col items-center gap-1 [writing-mode:vertical-rl] rotate-180 mt-2">
              <span className="text-[10px] font-bold text-[#323338] tracking-widest uppercase opacity-50">
                {activeTab === 'notes' ? 'הערות' : 'הדרכה'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
