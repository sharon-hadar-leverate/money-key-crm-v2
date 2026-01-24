'use client'

import Link from 'next/link'
import { BookOpen, Star, MoreHorizontal, Pencil, Trash2, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { Playbook } from '@/types/playbooks'
import { PLAYBOOK_CATEGORIES } from '@/types/playbooks'

interface PlaybookCardProps {
  playbook: Playbook
  onDelete?: (id: string) => void
}

export function PlaybookCard({ playbook, onDelete }: PlaybookCardProps) {
  const categoryLabel = PLAYBOOK_CATEGORIES.find(c => c.value === playbook.category)?.label

  return (
    <div className="monday-card p-5 hover:shadow-md transition-shadow group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            playbook.is_default ? 'bg-[#FFF0D6]' : 'bg-[#E5F6F7]'
          )}>
            <BookOpen className={cn(
              'h-5 w-5',
              playbook.is_default ? 'text-[#D17A00]' : 'text-[#00A0B0]'
            )} />
          </div>
          <div>
            <h3 className="font-semibold text-[#323338] text-base">{playbook.name}</h3>
            {playbook.is_default && (
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="h-3 w-3 text-[#D17A00] fill-[#D17A00]" />
                <span className="text-[10px] text-[#D17A00]">ברירת מחדל</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions Menu */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#F5F6F8] transition-all">
              <MoreHorizontal className="h-4 w-4 text-[#676879]" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-1" align="end">
            <Link
              href={`/playbooks/${playbook.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[#323338] hover:bg-[#F5F6F8] rounded-lg transition-colors"
            >
              <Pencil className="h-4 w-4" />
              עריכה
            </Link>
            {onDelete && (
              <button
                onClick={() => onDelete(playbook.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#D83A52] hover:bg-[#FFD6D9]/30 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                מחיקה
              </button>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Description */}
      {playbook.description && (
        <p className="text-sm text-[#676879] mb-4 line-clamp-2">
          {playbook.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[#E6E9EF]">
        <div className="flex items-center gap-3">
          {categoryLabel && (
            <div className="flex items-center gap-1.5 text-xs text-[#676879]">
              <FolderOpen className="h-3.5 w-3.5" />
              {categoryLabel}
            </div>
          )}
        </div>
        <span className="text-xs text-[#9B9BAD]">
          {formatDate(playbook.updated_at || playbook.created_at)}
        </span>
      </div>

      {/* Click to edit link */}
      <Link
        href={`/playbooks/${playbook.id}`}
        className="absolute inset-0 rounded-lg"
        aria-label={`ערוך ${playbook.name}`}
      />
    </div>
  )
}
