'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { formatDistanceToNow, format, isToday, isTomorrow, isPast } from 'date-fns'
import { he } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import {
  CheckCircle2,
  Circle,
  Clock,
  User,
  Link as LinkIcon,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { completeTask } from '@/actions/tasks'
import type { Task } from '@/types/tasks'

interface TaskCardProps {
  task: Task
  onComplete?: () => void
}

const priorityStyles = {
  low: 'text-[#9B9BAD]',
  normal: 'text-[#676879]',
  high: 'text-[#FDAB3D]',
  urgent: 'text-[#D83A52]',
}

const priorityLabels = {
  low: 'נמוכה',
  normal: 'רגילה',
  high: 'גבוהה',
  urgent: 'דחופה',
}

function formatDueDate(dateStr: string | null): { text: string; isOverdue: boolean } {
  if (!dateStr) return { text: '', isOverdue: false }

  const date = new Date(dateStr)
  const now = new Date()

  if (isToday(date)) {
    return { text: 'היום', isOverdue: false }
  }
  if (isTomorrow(date)) {
    return { text: 'מחר', isOverdue: false }
  }
  if (isPast(date)) {
    return {
      text: `איחור: ${formatDistanceToNow(date, { locale: he })}`,
      isOverdue: true,
    }
  }

  return {
    text: format(date, 'dd/MM', { locale: he }),
    isOverdue: false,
  }
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  const [isPending, startTransition] = useTransition()
  const isCompleted = task.status === 'completed'
  const dueInfo = formatDueDate(task.due_date)

  const handleComplete = () => {
    startTransition(async () => {
      await completeTask(task.id)
      onComplete?.()
    })
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border border-[#E6E9EF] bg-white transition-all',
        isCompleted && 'opacity-60',
        dueInfo.isOverdue && !isCompleted && 'border-[#D83A52]/30 bg-[#FFF5F5]'
      )}
    >
      {/* Complete Button */}
      <button
        onClick={handleComplete}
        disabled={isPending || isCompleted}
        className={cn(
          'mt-0.5 shrink-0 transition-colors',
          isCompleted
            ? 'text-[#00854D]'
            : 'text-[#9B9BAD] hover:text-[#00A0B0]'
        )}
        aria-label={isCompleted ? 'הושלם' : 'סמן כהושלם'}
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isCompleted ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            isCompleted
              ? 'text-[#9B9BAD] line-through'
              : 'text-[#323338]'
          )}
        >
          {task.title}
        </p>

        {task.description && (
          <p className="text-xs text-[#9B9BAD] mt-0.5 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {/* Due date */}
          {task.due_date && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs',
                dueInfo.isOverdue && !isCompleted
                  ? 'text-[#D83A52]'
                  : 'text-[#9B9BAD]'
              )}
            >
              {dueInfo.isOverdue && !isCompleted ? (
                <AlertTriangle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {dueInfo.text}
            </div>
          )}

          {/* Priority */}
          {task.priority !== 'normal' && (
            <span
              className={cn(
                'text-xs font-medium',
                priorityStyles[task.priority]
              )}
            >
              {priorityLabels[task.priority]}
            </span>
          )}

          {/* Lead link */}
          {task.lead_id && (
            <Link
              href={`/leads/${task.lead_id}`}
              className="flex items-center gap-1 text-xs text-[#00A0B0] hover:underline"
            >
              <LinkIcon className="h-3 w-3" />
              צפה בליד
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
