'use client'

import { useState } from 'react'
import { ChevronDown, Check, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { Playbook } from '@/types/playbooks'

interface PlaybookSelectorProps {
  playbooks: Playbook[]
  selectedId: string | null
  defaultPlaybookId: string | null
  onChange: (playbookId: string | null) => void
  disabled?: boolean
}

export function PlaybookSelector({
  playbooks,
  selectedId,
  defaultPlaybookId,
  onChange,
  disabled = false,
}: PlaybookSelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedPlaybook = playbooks.find(p => p.id === selectedId)
  const defaultPlaybook = playbooks.find(p => p.id === defaultPlaybookId)

  // Display name logic
  const displayName = selectedPlaybook
    ? selectedPlaybook.name
    : defaultPlaybook
    ? `${defaultPlaybook.name} (ברירת מחדל)`
    : 'בחר הדרכה'

  const handleSelect = (playbookId: string | null) => {
    onChange(playbookId)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-all text-sm',
            'bg-white border-[#E6E9EF] hover:border-[#00A0B0]',
            'focus:outline-none focus:ring-2 focus:ring-[#00A0B0]/20',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-4 w-4 text-[#676879] shrink-0" />
            <span className="truncate text-[#323338]">{displayName}</span>
          </div>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-[#9B9BAD] shrink-0 transition-transform',
              open && 'rotate-180'
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="start">
        {/* Default option */}
        {defaultPlaybook && (
          <>
            <button
              onClick={() => handleSelect(null)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                selectedId === null
                  ? 'bg-[#E5F6F7] text-[#00A0B0]'
                  : 'hover:bg-[#F5F6F8] text-[#323338]'
              )}
            >
              <div className="flex items-center gap-2">
                <span>{defaultPlaybook.name}</span>
                <span className="text-[10px] text-[#9B9BAD] bg-[#F5F6F8] px-1.5 py-0.5 rounded">
                  ברירת מחדל
                </span>
              </div>
              {selectedId === null && <Check className="h-4 w-4" />}
            </button>
            <div className="my-1 border-t border-[#E6E9EF]" />
          </>
        )}

        {/* Other playbooks */}
        {playbooks
          .filter(p => p.id !== defaultPlaybookId)
          .map(playbook => (
            <button
              key={playbook.id}
              onClick={() => handleSelect(playbook.id)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors',
                selectedId === playbook.id
                  ? 'bg-[#E5F6F7] text-[#00A0B0]'
                  : 'hover:bg-[#F5F6F8] text-[#323338]'
              )}
            >
              <span className="truncate">{playbook.name}</span>
              {selectedId === playbook.id && <Check className="h-4 w-4" />}
            </button>
          ))}

        {playbooks.length === 0 && (
          <div className="px-3 py-4 text-center text-sm text-[#9B9BAD]">
            אין הדרכות זמינות
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
