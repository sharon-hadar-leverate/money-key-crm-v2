'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Loader2, Calendar, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createTask } from '@/actions/tasks'
import type { TaskPriority } from '@/types/tasks'

interface CreateTaskDialogProps {
  isOpen: boolean
  onClose: () => void
  leadId?: string
}

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'נמוכה', color: 'text-[#9B9BAD]' },
  { value: 'normal', label: 'רגילה', color: 'text-[#676879]' },
  { value: 'high', label: 'גבוהה', color: 'text-[#FDAB3D]' },
  { value: 'urgent', label: 'דחופה', color: 'text-[#D83A52]' },
]

export function CreateTaskDialog({
  isOpen,
  onClose,
  leadId,
}: CreateTaskDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('יש להזין כותרת למשימה')
      return
    }

    startTransition(async () => {
      const result = await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate || undefined,
        priority,
        lead_id: leadId,
      })

      if (result.success) {
        setTitle('')
        setDescription('')
        setDueDate('')
        setPriority('normal')
        onClose()
        router.refresh()
      } else {
        setError(result.error || 'שגיאה ביצירת המשימה')
      }
    })
  }

  const handleClose = () => {
    if (!isPending) {
      setTitle('')
      setDescription('')
      setDueDate('')
      setPriority('normal')
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6E9EF]">
          <h2 className="font-semibold text-[#323338]">משימה חדשה</h2>
          <button
            onClick={handleClose}
            disabled={isPending}
            className="p-1 rounded-lg hover:bg-[#F5F6F8] transition-colors"
          >
            <X className="h-5 w-5 text-[#676879]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#323338] mb-1">
              כותרת <span className="text-[#D83A52]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="מה צריך לעשות?"
              className="w-full px-3 py-2 border border-[#E6E9EF] rounded-lg text-sm focus:outline-none focus:border-[#00A0B0] transition-colors"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-[#323338] mb-1">
              תיאור
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="פרטים נוספים (אופציונלי)"
              rows={3}
              className="w-full px-3 py-2 border border-[#E6E9EF] rounded-lg text-sm focus:outline-none focus:border-[#00A0B0] transition-colors resize-none"
            />
          </div>

          {/* Due Date & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#323338] mb-1">
                <Calendar className="h-4 w-4 inline ml-1" />
                תאריך יעד
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-[#E6E9EF] rounded-lg text-sm focus:outline-none focus:border-[#00A0B0] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#323338] mb-1">
                <Flag className="h-4 w-4 inline ml-1" />
                עדיפות
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 border border-[#E6E9EF] rounded-lg text-sm focus:outline-none focus:border-[#00A0B0] transition-colors bg-white"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-[#D83A52]">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="px-4 py-2 text-sm text-[#676879] hover:bg-[#F5F6F8] rounded-lg transition-colors"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00A0B0] rounded-lg transition-colors',
                isPending ? 'opacity-50' : 'hover:bg-[#008090]'
              )}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              צור משימה
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
