'use client'

import { useState } from 'react'
import { ClipboardList, ChevronLeft } from 'lucide-react'
import { QuestionnaireForm } from './questionnaire-form'
import { QuestionnaireCard, QuestionnaireSectionHeader, UnfilledQuestionnairesPlaceholder } from './questionnaire-card'
import {
  createOrUpdateResponse,
  completeResponse,
} from '@/actions/questionnaire'
import { calculateProgress } from '@/lib/questionnaire-utils'
import type {
  Questionnaire,
  QuestionnaireWithFields,
  QuestionnaireResponse,
  Answers,
} from '@/types/questionnaire'

interface LeadQuestionnairePanelProps {
  leadId: string
  unfilled: Questionnaire[]
  filled: Array<{ questionnaire: Questionnaire; response: QuestionnaireResponse }>
  // Full questionnaire data (with fields) for modal
  questionnairesWithFields: Map<string, QuestionnaireWithFields>
}

export function LeadQuestionnairePanel({
  leadId,
  unfilled,
  filled,
  questionnairesWithFields,
}: LeadQuestionnairePanelProps) {
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<{
    questionnaire: QuestionnaireWithFields
    response: QuestionnaireResponse | null
  } | null>(null)

  const handleSelectUnfilled = (q: Questionnaire) => {
    const full = questionnairesWithFields.get(q.id)
    if (full) {
      setSelectedQuestionnaire({ questionnaire: full, response: null })
    }
  }

  const handleSelectFilled = (q: Questionnaire, response: QuestionnaireResponse) => {
    const full = questionnairesWithFields.get(q.id)
    if (full) {
      setSelectedQuestionnaire({ questionnaire: full, response })
    }
  }

  const handleClose = () => {
    setSelectedQuestionnaire(null)
  }

  const handleSave = async (answers: Answers) => {
    if (!selectedQuestionnaire) return { success: false, error: 'לא נבחר שאלון' }

    const result = await createOrUpdateResponse({
      questionnaire_id: selectedQuestionnaire.questionnaire.id,
      target_type: 'lead',
      target_id: leadId,
      answers,
      status: 'draft',
    })

    // Update local state if successful
    if (result.success && result.data) {
      setSelectedQuestionnaire(prev => prev ? {
        ...prev,
        response: result.data!,
      } : null)
    }

    return result
  }

  const handleComplete = async () => {
    if (!selectedQuestionnaire?.response) {
      return { success: false, error: 'אין תשובות לשמור' }
    }

    const result = await completeResponse(selectedQuestionnaire.response.id)

    if (result.success) {
      handleClose()
    }

    return result
  }

  // If a questionnaire is selected, show the form
  if (selectedQuestionnaire) {
    return (
      <div className="space-y-4">
        {/* Header with back button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-[#F5F6F8] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#676879]" />
          </button>
          <div>
            <h3 className="font-semibold text-[#323338]">
              {selectedQuestionnaire.questionnaire.name}
            </h3>
            {selectedQuestionnaire.questionnaire.description && (
              <p className="text-xs text-[#9B9BAD]">
                {selectedQuestionnaire.questionnaire.description}
              </p>
            )}
          </div>
        </div>

        {/* Form */}
        <QuestionnaireForm
          questionnaire={selectedQuestionnaire.questionnaire}
          response={selectedQuestionnaire.response}
          onSave={handleSave}
          onComplete={handleComplete}
        />
      </div>
    )
  }

  // Show unfilled questionnaires list
  return (
    <div className="space-y-4">
      <QuestionnaireSectionHeader
        title="שאלונים למילוי"
        count={unfilled.length}
        icon={ClipboardList}
      />

      {unfilled.length === 0 ? (
        <UnfilledQuestionnairesPlaceholder />
      ) : (
        <div className="space-y-2">
          {unfilled.map((q) => {
            const full = questionnairesWithFields.get(q.id)
            const progress = full ? calculateProgress(full.fields, {}) : null

            return (
              <QuestionnaireCard
                key={q.id}
                questionnaire={q}
                progress={progress}
                onClick={() => handleSelectUnfilled(q)}
                compact
              />
            )
          })}
        </div>
      )}

      {/* Filled questionnaires preview */}
      {filled.length > 0 && (
        <div className="pt-4 border-t border-[#E6E9EF]">
          <QuestionnaireSectionHeader
            title="שאלונים שהושלמו"
            count={filled.length}
          />
          <div className="space-y-2">
            {filled.map(({ questionnaire, response }) => {
              const full = questionnairesWithFields.get(questionnaire.id)
              const progress = full
                ? calculateProgress(full.fields, response.answers)
                : null

              return (
                <QuestionnaireCard
                  key={questionnaire.id}
                  questionnaire={questionnaire}
                  response={response}
                  progress={progress}
                  onClick={() => handleSelectFilled(questionnaire, response)}
                  compact
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
