'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Save, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { QuestionField } from './question-field'
import { QuestionnaireProgressBar } from './questionnaire-progress'
import { calculateProgress } from '@/lib/questionnaire-utils'
import type {
  QuestionnaireWithFields,
  QuestionnaireResponse,
  Answers,
  AnswerValue,
} from '@/types/questionnaire'

interface QuestionnaireFormProps {
  questionnaire: QuestionnaireWithFields
  response?: QuestionnaireResponse | null
  onSave: (answers: Answers) => Promise<{ success: boolean; error?: string }>
  onComplete: () => Promise<{ success: boolean; error?: string }>
  readOnly?: boolean
  autoSave?: boolean
  autoSaveDelay?: number
}

export function QuestionnaireForm({
  questionnaire,
  response,
  onSave,
  onComplete,
  readOnly = false,
  autoSave = true,
  autoSaveDelay = 1500,
}: QuestionnaireFormProps) {
  const [answers, setAnswers] = useState<Answers>(response?.answers ?? {})
  const [isSaving, setIsSaving] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Calculate progress
  const progress = useMemo(
    () => calculateProgress(questionnaire.fields, answers),
    [questionnaire.fields, answers]
  )

  // Auto-save debounce
  useEffect(() => {
    if (!autoSave || readOnly || !hasUnsavedChanges) return

    const timer = setTimeout(async () => {
      await handleSave()
    }, autoSaveDelay)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, autoSave, readOnly, hasUnsavedChanges, autoSaveDelay])

  // Handle field change
  const handleFieldChange = useCallback((fieldSlug: string, value: AnswerValue) => {
    setAnswers(prev => ({
      ...prev,
      [fieldSlug]: value,
    }))
    setHasUnsavedChanges(true)

    // Clear error for this field
    if (errors[fieldSlug]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldSlug]
        return newErrors
      })
    }
  }, [errors])

  // Save handler
  const handleSave = async () => {
    if (readOnly || isSaving) return

    setIsSaving(true)
    try {
      const result = await onSave(answers)
      if (result.success) {
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
      } else {
        toast.error(result.error || 'שגיאה בשמירה')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Validate required fields
  const validateRequired = (): boolean => {
    const newErrors: Record<string, string> = {}

    for (const field of questionnaire.fields) {
      if (field.is_required) {
        const value = answers[field.slug]
        if (value === undefined || value === null || value === '') {
          newErrors[field.slug] = 'שדה חובה'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Complete handler
  const handleComplete = async () => {
    if (readOnly || isCompleting) return

    // Validate
    if (!validateRequired()) {
      toast.error('נא למלא את כל שדות החובה')
      return
    }

    setIsCompleting(true)
    try {
      // Save first
      await handleSave()

      const result = await onComplete()
      if (result.success) {
        toast.success('השאלון הושלם בהצלחה')
      } else {
        toast.error(result.error || 'שגיאה בהשלמת השאלון')
      }
    } finally {
      setIsCompleting(false)
    }
  }

  const isCompleted = response?.status === 'completed'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#323338]">{questionnaire.name}</h2>
            {questionnaire.description && (
              <p className="text-sm text-[#676879] mt-1">{questionnaire.description}</p>
            )}
          </div>

          {/* Save Status */}
          {!readOnly && (
            <div className="flex items-center gap-2 text-xs text-[#9B9BAD] shrink-0">
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>שומר...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00854D]" />
                  <span>נשמר</span>
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Progress */}
        <QuestionnaireProgressBar progress={progress} />
      </div>

      {/* Fields */}
      <div className="space-y-5">
        {questionnaire.fields.map((field) => (
          <QuestionField
            key={field.id}
            field={field}
            value={answers[field.slug] ?? null}
            onChange={(value) => handleFieldChange(field.slug, value)}
            detailValue={(answers[`${field.slug}_detail`] as string) ?? null}
            onDetailChange={(value) => handleFieldChange(`${field.slug}_detail`, value)}
            disabled={readOnly || isCompleted}
            error={errors[field.slug]}
          />
        ))}
      </div>

      {/* Actions */}
      {!readOnly && !isCompleted && (
        <div className="flex items-center gap-3 pt-4 border-t border-[#E6E9EF]">
          <button
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              "bg-[#F5F6F8] text-[#676879] hover:bg-[#ECEDF0]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Save className="w-4 h-4" />
            שמור טיוטה
          </button>

          <button
            onClick={handleComplete}
            disabled={isCompleting || !progress.isComplete}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all",
              "bg-[#00A0B0] text-white hover:bg-[#008A99]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isCompleting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            סיים שאלון
          </button>

          {!progress.isComplete && (
            <span className="text-xs text-[#9B9BAD]">
              חסרים {progress.required - progress.requiredAnswered} שדות חובה
            </span>
          )}
        </div>
      )}

      {/* Completed badge */}
      {isCompleted && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-[#D4F4DD] text-[#00854D]">
          <Check className="w-5 h-5" />
          <span className="font-medium">השאלון הושלם</span>
          {response?.completed_at && (
            <span className="text-sm opacity-80">
              ({new Date(response.completed_at).toLocaleDateString('he-IL')})
            </span>
          )}
        </div>
      )}
    </div>
  )
}
