'use client'

import { useState, useEffect, useTransition } from 'react'
import { BookOpen, MessageSquare, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PlaybookViewer } from './playbook-viewer'
import { PlaybookSelector } from './playbook-selector'
import { setLeadPlaybook } from '@/actions/playbooks'
import { toast } from 'sonner'
import type { Playbook } from '@/types/playbooks'
import type { NoteWithUser } from '@/actions/notes'
import { NotesSection } from '../leads/notes-section'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface PlaybookMobileSheetProps {
  leadId: string
  playbooks: Playbook[]
  currentPlaybook: Playbook | null
  currentPlaybookId: string | null
  defaultPlaybookId: string | null
  initialNotes?: NoteWithUser[]
}

export function PlaybookMobileSheet({
  leadId,
  playbooks,
  currentPlaybook,
  currentPlaybookId,
  defaultPlaybookId,
  initialNotes = [],
}: PlaybookMobileSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'playbook' | 'notes'>('notes')
  const [selectedId, setSelectedId] = useState<string | null>(currentPlaybookId)
  const [displayedPlaybook, setDisplayedPlaybook] = useState<Playbook | null>(currentPlaybook)
  const [isPending, startTransition] = useTransition()

  // Update displayed playbook when selection changes
  useEffect(() => {
    if (selectedId) {
      const playbook = playbooks.find(p => p.id === selectedId)
      if (playbook) setDisplayedPlaybook(playbook)
    } else {
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
        setSelectedId(currentPlaybookId)
      }
    })
  }

  const openWithTab = (tab: 'playbook' | 'notes') => {
    setActiveTab(tab)
    setIsOpen(true)
  }

  return (
    <>
      {/* FAB - Only visible on mobile */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col gap-2 md:hidden">
        <button
          onClick={() => openWithTab('notes')}
          className={cn(
            "p-3 rounded-full shadow-lg transition-all",
            "bg-[#FDEBDC] hover:bg-[#FDEBDC]/90 active:scale-95",
            initialNotes.length > 0 && "ring-2 ring-[#E07239] ring-offset-2"
          )}
          aria-label="הערות"
        >
          <MessageSquare className="h-5 w-5 text-[#E07239]" />
        </button>
        <button
          onClick={() => openWithTab('playbook')}
          className={cn(
            "p-3 rounded-full shadow-lg transition-all",
            "bg-[#E5F6F7] hover:bg-[#E5F6F7]/90 active:scale-95"
          )}
          aria-label="הדרכה"
        >
          <BookOpen className="h-5 w-5 text-[#00A0B0]" />
        </button>
      </div>

      {/* Bottom Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="bottom" 
          className="h-[75vh] rounded-t-2xl p-0 flex flex-col"
        >
          {/* Custom Header with Tabs */}
          <SheetHeader className="border-b border-[#E6E9EF] bg-[#F9FAFB] rounded-t-2xl p-0">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('notes')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
                    activeTab === 'notes'
                      ? "bg-white shadow-sm text-[#00A0B0] border border-[#E6E9EF]"
                      : "text-[#676879] hover:bg-[#E6E9EF]/50"
                  )}
                >
                  <MessageSquare className="h-4 w-4" />
                  הערות
                </button>
                <button
                  onClick={() => setActiveTab('playbook')}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
                    activeTab === 'playbook'
                      ? "bg-white shadow-sm text-[#00A0B0] border border-[#E6E9EF]"
                      : "text-[#676879] hover:bg-[#E6E9EF]/50"
                  )}
                >
                  <BookOpen className="h-4 w-4" />
                  הדרכה
                </button>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-[#E6E9EF] transition-colors"
              >
                <X className="h-5 w-5 text-[#676879]" />
              </button>
            </div>
            {/* Hidden title for accessibility */}
            <SheetTitle className="sr-only">
              {activeTab === 'notes' ? 'הערות' : 'הדרכה'}
            </SheetTitle>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-white">
            {activeTab === 'playbook' ? (
              <div className="flex flex-col h-full">
                {/* Selector */}
                <div className="p-4 border-b border-[#E6E9EF]">
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
              <NotesSection leadId={leadId} initialNotes={initialNotes} isEmbedded />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
