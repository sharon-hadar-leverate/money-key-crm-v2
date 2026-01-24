'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, ArrowRight, Star } from 'lucide-react'
import { PlaybookEditor } from './playbook-editor'
import { createPlaybook, updatePlaybook } from '@/actions/playbooks'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { PLAYBOOK_CATEGORIES } from '@/types/playbooks'
import type { Playbook } from '@/types/playbooks'

interface PlaybookFormProps {
  playbook?: Playbook | null
  mode: 'create' | 'edit'
}

export function PlaybookForm({ playbook, mode }: PlaybookFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: playbook?.name ?? '',
    description: playbook?.description ?? '',
    content: playbook?.content ?? '',
    category: playbook?.category ?? '',
    is_default: playbook?.is_default ?? false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('נא להזין שם להדרכה')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'create') {
        const result = await createPlaybook({
          name: formData.name,
          description: formData.description || undefined,
          content: formData.content,
          category: formData.category || undefined,
          is_default: formData.is_default,
        })

        if (result.success) {
          toast.success('ההדרכה נוצרה בהצלחה')
          router.push('/playbooks')
        } else {
          toast.error(result.error || 'שגיאה ביצירת ההדרכה')
        }
      } else {
        if (!playbook?.id) return

        const result = await updatePlaybook({
          id: playbook.id,
          name: formData.name,
          description: formData.description || undefined,
          content: formData.content,
          category: formData.category || undefined,
          is_default: formData.is_default,
        })

        if (result.success) {
          toast.success('ההדרכה עודכנה בהצלחה')
          router.push('/playbooks')
        } else {
          toast.error(result.error || 'שגיאה בעדכון ההדרכה')
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => router.push('/playbooks')}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#E6E9EF] text-[#676879] hover:text-[#323338] hover:border-[#00A0B0] transition-all text-sm"
      >
        <ArrowRight className="h-4 w-4" />
        חזרה להדרכות
      </button>

      {/* Basic Info Card */}
      <div className="monday-card p-5">
        <h2 className="text-base font-semibold text-[#323338] mb-4">פרטי ההדרכה</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm text-[#676879]">שם ההדרכה *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full h-10 px-4 rounded-lg bg-white border border-[#E6E9EF] text-[#323338] focus:outline-none focus:border-[#00A0B0] focus:ring-2 focus:ring-[#00A0B0]/20 transition-all"
              placeholder="לדוגמה: מדריך מכירות בסיסי"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm text-[#676879]">תיאור קצר</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full h-20 px-4 py-2 rounded-lg bg-white border border-[#E6E9EF] text-[#323338] focus:outline-none focus:border-[#00A0B0] focus:ring-2 focus:ring-[#00A0B0]/20 transition-all resize-none"
              placeholder="תיאור קצר של ההדרכה..."
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm text-[#676879]">קטגוריה</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full h-10 px-4 rounded-lg bg-white border border-[#E6E9EF] text-[#323338] focus:outline-none focus:border-[#00A0B0] focus:ring-2 focus:ring-[#00A0B0]/20 transition-all"
            >
              <option value="">ללא קטגוריה</option>
              {PLAYBOOK_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Is Default */}
          <div className="space-y-2">
            <label className="text-sm text-[#676879]">הגדרות</label>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, is_default: !prev.is_default }))}
              className={cn(
                'w-full h-10 px-4 rounded-lg border transition-all flex items-center justify-center gap-2',
                formData.is_default
                  ? 'bg-[#FFF0D6] border-[#D17A00] text-[#D17A00]'
                  : 'bg-white border-[#E6E9EF] text-[#676879] hover:border-[#D17A00] hover:text-[#D17A00]'
              )}
            >
              <Star className={cn('h-4 w-4', formData.is_default && 'fill-current')} />
              {formData.is_default ? 'הדרכת ברירת מחדל' : 'הגדר כברירת מחדל'}
            </button>
          </div>
        </div>
      </div>

      {/* Content Editor Card */}
      <div className="monday-card p-5">
        <h2 className="text-base font-semibold text-[#323338] mb-4">תוכן ההדרכה</h2>
        <PlaybookEditor
          value={formData.content}
          onChange={(content) => setFormData(prev => ({ ...prev, content }))}
          height={500}
        />
      </div>

      {/* Submit Button */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#00A0B0] text-white font-medium transition-all',
            isSubmitting ? 'opacity-50 cursor-wait' : 'hover:bg-[#008A99]'
          )}
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? 'שומר...' : mode === 'create' ? 'צור הדרכה' : 'שמור שינויים'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/playbooks')}
          className="px-6 py-2.5 rounded-lg bg-[#F5F6F8] border border-[#E6E9EF] text-[#676879] hover:text-[#323338] transition-all"
        >
          ביטול
        </button>
      </div>
    </form>
  )
}
