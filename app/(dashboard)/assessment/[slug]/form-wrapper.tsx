'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QuestionnaireForm } from '@/components/questionnaire'
import {
  createOrUpdateResponse,
  completeResponse,
} from '@/actions/questionnaire'
import type {
  QuestionnaireWithFields,
  QuestionnaireResponse,
  Answers,
} from '@/types/questionnaire'

interface AssessmentFormWrapperProps {
  questionnaire: QuestionnaireWithFields
  response: QuestionnaireResponse | null
  userId: string
}

export function AssessmentFormWrapper({
  questionnaire,
  response: initialResponse,
  userId,
}: AssessmentFormWrapperProps) {
  const router = useRouter()
  // Track the response ID locally after first save
  const [responseId, setResponseId] = useState<string | null>(initialResponse?.id ?? null)

  const handleSave = async (answers: Answers) => {
    const result = await createOrUpdateResponse({
      questionnaire_id: questionnaire.id,
      target_type: 'business',
      target_id: userId,
      answers,
      status: 'draft',
    })

    // Store the response ID for later use in complete
    if (result.success && result.data?.id) {
      setResponseId(result.data.id)
    }

    return result
  }

  const handleComplete = async () => {
    // Use the tracked response ID
    if (!responseId) {
      return { success: false, error: 'אין תשובות לשמור. יש לשמור תחילה.' }
    }

    const result = await completeResponse(responseId)

    if (result.success) {
      router.refresh()
      // Navigate back to tasks page after completion
      router.push('/tasks')
    }

    return result
  }

  return (
    <QuestionnaireForm
      questionnaire={questionnaire}
      response={initialResponse}
      onSave={handleSave}
      onComplete={handleComplete}
    />
  )
}
