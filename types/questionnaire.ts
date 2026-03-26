// ============================================
// QUESTIONNAIRE SYSTEM TYPES
// ============================================

import type { Json } from './database'

// Field types supported by the questionnaire system
export const FIELD_TYPES = [
  'text',
  'number',
  'boolean',
  'select',
  'multiselect',
  'scale',
  'date',
] as const

export type FieldType = (typeof FIELD_TYPES)[number]

// Response status
export const RESPONSE_STATUSES = ['draft', 'completed'] as const
export type ResponseStatus = (typeof RESPONSE_STATUSES)[number]

// Common target types (extensible)
export const TARGET_TYPES = ['lead', 'user', 'business'] as const
export type TargetType = (typeof TARGET_TYPES)[number] | string

// ============================================
// QUESTIONNAIRE DEFINITION
// ============================================

export interface QuestionnaireSettings {
  icon?: string
  color?: string
  pillar?: string
  [key: string]: unknown
}

export interface Questionnaire {
  id: string
  slug: string
  name: string
  description: string | null
  category: string | null
  tags: string[]
  settings: QuestionnaireSettings
  is_active: boolean
  display_order: number
  created_at: string | null
  updated_at: string | null
  created_by: string | null
}

export interface CreateQuestionnaireInput {
  slug: string
  name: string
  description?: string
  category?: string
  tags?: string[]
  settings?: QuestionnaireSettings
  display_order?: number
}

export interface UpdateQuestionnaireInput {
  id: string
  slug?: string
  name?: string
  description?: string
  category?: string
  tags?: string[]
  settings?: QuestionnaireSettings
  is_active?: boolean
  display_order?: number
}

// ============================================
// QUESTIONNAIRE FIELDS
// ============================================

export interface SelectOption {
  value: string
  label: string
}

export interface FieldConfig {
  // Common
  placeholder?: string
  helperText?: string
  // Number
  min?: number
  max?: number
  prefix?: string  // e.g., "₪"
  suffix?: string  // e.g., "%"
  // Text
  multiline?: boolean
  // Select/Multiselect
  options?: SelectOption[]
  // Scale
  labels?: [string, string]  // [minLabel, maxLabel]
  // Boolean
  checkboxLabel?: string
  // Detail sub-field (free text below the main field)
  detailField?: {
    placeholder?: string
    label?: string
  }
  // Any additional config
  [key: string]: unknown
}

export interface QuestionnaireField {
  id: string
  questionnaire_id: string
  slug: string
  label: string
  field_type: FieldType
  config: FieldConfig
  is_required: boolean
  display_order: number
  created_at: string | null
}

export interface CreateFieldInput {
  questionnaire_id: string
  slug: string
  label: string
  field_type: FieldType
  config?: FieldConfig
  is_required?: boolean
  display_order?: number
}

export interface UpdateFieldInput {
  id: string
  slug?: string
  label?: string
  field_type?: FieldType
  config?: FieldConfig
  is_required?: boolean
  display_order?: number
}

// ============================================
// QUESTIONNAIRE RESPONSES
// ============================================

// Answer value can be various types
export type AnswerValue =
  | string
  | number
  | boolean
  | string[]  // for multiselect
  | null

// Answers indexed by field slug
export type Answers = Record<string, AnswerValue>

export interface QuestionnaireResponse {
  id: string
  questionnaire_id: string
  target_type: string
  target_id: string
  respondent_id: string | null
  answers: Answers
  status: ResponseStatus
  started_at: string | null
  completed_at: string | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}

export interface CreateResponseInput {
  questionnaire_id: string
  target_type: string
  target_id: string
  respondent_id?: string
  answers?: Answers
  status?: ResponseStatus
}

export interface UpdateResponseInput {
  id: string
  answers?: Answers
  status?: ResponseStatus
}

// ============================================
// COMBINED TYPES (for API responses)
// ============================================

export interface QuestionnaireWithFields extends Questionnaire {
  fields: QuestionnaireField[]
}

export interface ResponseWithQuestionnaire extends QuestionnaireResponse {
  questionnaire: Questionnaire
}

export interface ResponseWithDetails extends QuestionnaireResponse {
  questionnaire: QuestionnaireWithFields
  respondent_name?: string
}

// ============================================
// FILTER OPTIONS
// ============================================

export interface QuestionnaireFilterOptions {
  category?: string
  tags?: string[]
  isActive?: boolean
}

export interface ResponseFilterOptions {
  questionnaire_id?: string
  target_type?: string
  target_id?: string
  respondent_id?: string
  status?: ResponseStatus
  includeDeleted?: boolean
}

// ============================================
// HELPER TYPES
// ============================================

// For computing progress
export interface QuestionnaireProgress {
  total: number
  answered: number
  required: number
  requiredAnswered: number
  percentage: number
  isComplete: boolean
}

// Category configurations (for UI)
export const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  business: { label: 'הערכת עסק', icon: 'Building2', color: '#00A0B0' },
  lead: { label: 'שאלוני ליד', icon: 'UserCheck', color: '#00854D' },
  feedback: { label: 'משוב', icon: 'MessageSquare', color: '#9D5BD2' },
}
