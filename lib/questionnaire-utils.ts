// Questionnaire utility functions (can be used in both server and client)

import type {
  QuestionnaireField,
  Answers,
  QuestionnaireProgress,
} from '@/types/questionnaire'

/**
 * Calculate progress for a questionnaire based on fields and answers
 */
export function calculateProgress(
  fields: QuestionnaireField[],
  answers: Answers
): QuestionnaireProgress {
  const total = fields.length
  const required = fields.filter(f => f.is_required).length

  let answered = 0
  let requiredAnswered = 0

  for (const field of fields) {
    const answer = answers[field.slug]
    const hasAnswer = answer !== undefined && answer !== null && answer !== ''

    if (hasAnswer) {
      answered++
      if (field.is_required) {
        requiredAnswered++
      }
    }
  }

  const percentage = total > 0 ? Math.round((answered / total) * 100) : 0
  const isComplete = requiredAnswered >= required

  return {
    total,
    answered,
    required,
    requiredAnswered,
    percentage,
    isComplete,
  }
}
