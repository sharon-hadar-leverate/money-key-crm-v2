'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ClipboardList, Check, Clock, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { QuestionnaireForm } from './questionnaire-form'
import { calculateProgress } from '@/lib/questionnaire-utils'
import type {
  Questionnaire,
  QuestionnaireWithFields,
  QuestionnaireResponse,
} from '@/types/questionnaire'

interface LeadQuestionnaireTabProps {
  leadId: string
  filled: Array<{ questionnaire: Questionnaire; response: QuestionnaireResponse }>
  unfilled: Questionnaire[]
  questionnairesWithFields: Map<string, QuestionnaireWithFields>
}

export function LeadQuestionnaireTab({
  leadId,
  filled,
  unfilled,
  questionnairesWithFields,
}: LeadQuestionnaireTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (filled.length === 0 && unfilled.length === 0) {
    return (
      <div className="monday-card p-8 text-center">
        <ClipboardList className="w-12 h-12 mx-auto mb-3 text-[#9B9BAD] opacity-50" />
        <p className="text-[#676879]">אין שאלונים זמינים עבור ליד זה</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filled Questionnaires */}
      {filled.map(({ questionnaire, response }) => {
        const full = questionnairesWithFields.get(questionnaire.id)
        const isExpanded = expandedId === response.id
        const settings = questionnaire.settings
        const color = settings.color as string | undefined ?? '#00A0B0'
        const progress = full ? calculateProgress(full.fields, response.answers) : null
        const isCompleted = response.status === 'completed'

        return (
          <div key={response.id} className="monday-card overflow-hidden">
            {/* Colored top border */}
            <div className="h-1" style={{ backgroundColor: color }} />

            {/* Header */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : response.id)}
              className="w-full p-5 flex items-center gap-4 text-right hover:bg-[#F5F6F8]/50 transition-colors"
            >
              <div
                className="p-2.5 rounded-xl shrink-0"
                style={{ backgroundColor: `${color}15` }}
              >
                <ClipboardList className="w-5 h-5" style={{ color }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-[#323338]">{questionnaire.name}</h3>
                  {isCompleted ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#D4F4DD] text-[#00854D] text-xs">
                      <Check className="w-3 h-3" />
                      הושלם
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF8E5] text-[#D17A00] text-xs">
                      <Clock className="w-3 h-3" />
                      טיוטה
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-[#9B9BAD]">
                  {response.completed_at && (
                    <span>הושלם: {formatDate(response.completed_at)}</span>
                  )}
                  {progress && (
                    <span>{progress.answered}/{progress.total} שאלות</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Eye className="w-4 h-4 text-[#9B9BAD]" />
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-[#9B9BAD]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#9B9BAD]" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && full && (
              <div className="px-5 pb-5 border-t border-[#E6E9EF]">
                <div className="pt-5">
                  <QuestionnaireAnswersSummary
                    questionnaire={full}
                    response={response}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Unfilled Questionnaires Section */}
      {unfilled.length > 0 && (
        <div className="monday-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[#FFF8E5]">
              <ClipboardList className="w-4 h-4 text-[#D17A00]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#323338]">שאלונים ממתינים</h3>
              <p className="text-xs text-[#9B9BAD]">{unfilled.length} שאלונים טרם מולאו</p>
            </div>
          </div>

          <div className="space-y-2">
            {unfilled.map((q) => {
              const settings = q.settings
              const color = settings.color as string | undefined ?? '#00A0B0'

              return (
                <div
                  key={q.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-[#F5F6F8]"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-[#323338]">{q.name}</span>
                  <span className="text-xs text-[#9B9BAD] mr-auto">ממתין למילוי</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Component to display answers summary
interface QuestionnaireAnswersSummaryProps {
  questionnaire: QuestionnaireWithFields
  response: QuestionnaireResponse
}

function QuestionnaireAnswersSummary({
  questionnaire,
  response,
}: QuestionnaireAnswersSummaryProps) {
  const { fields } = questionnaire
  const { answers } = response

  return (
    <div className="space-y-4">
      {fields.map((field) => {
        const answer = answers[field.slug]
        const hasAnswer = answer !== undefined && answer !== null && answer !== ''

        return (
          <div key={field.id} className="flex items-start gap-4">
            <div className="flex-1">
              <div className="text-sm text-[#676879] mb-1">{field.label}</div>
              <div className="text-sm text-[#323338] font-medium">
                {hasAnswer ? formatAnswer(answer, field) : (
                  <span className="text-[#9B9BAD]">לא נענה</span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Format answer based on field type
function formatAnswer(value: unknown, field: QuestionnaireWithFields['fields'][0]): string {
  if (value === null || value === undefined) return '-'

  switch (field.field_type) {
    case 'boolean':
      return value === true ? 'כן' : 'לא'

    case 'select': {
      const options = field.config.options ?? []
      const option = options.find(o => o.value === value)
      return option?.label ?? String(value)
    }

    case 'multiselect': {
      const values = value as string[]
      const options = field.config.options ?? []
      return values
        .map(v => options.find(o => o.value === v)?.label ?? v)
        .join(', ')
    }

    case 'scale':
      return `${value} מתוך ${field.config.max ?? 5}`

    case 'number': {
      const num = Number(value)
      if (field.config.prefix) return `${field.config.prefix}${num.toLocaleString()}`
      if (field.config.suffix) return `${num.toLocaleString()}${field.config.suffix}`
      return num.toLocaleString()
    }

    default:
      return String(value)
  }
}
