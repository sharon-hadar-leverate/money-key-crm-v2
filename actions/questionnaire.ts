'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/tables'
import { createNotificationForAllUsers } from './notifications'
import type { Json } from '@/types/database'
import type {
  Questionnaire,
  QuestionnaireField,
  QuestionnaireResponse,
  QuestionnaireWithFields,
  CreateQuestionnaireInput,
  UpdateQuestionnaireInput,
  CreateFieldInput,
  UpdateFieldInput,
  CreateResponseInput,
  UpdateResponseInput,
  QuestionnaireFilterOptions,
  ResponseFilterOptions,
  Answers,
  FieldConfig,
} from '@/types/questionnaire'

// Helper to get current user ID
async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

// ============================================
// QUESTIONNAIRE CRUD
// ============================================

export async function getQuestionnaires(
  options?: QuestionnaireFilterOptions
): Promise<Questionnaire[]> {
  const supabase = await createClient()

  let query = supabase
    .from(Tables.questionnaires)
    .select('*')
    .order('display_order', { ascending: true })

  if (options?.category) {
    query = query.eq('category', options.category)
  }

  if (options?.isActive !== undefined) {
    query = query.eq('is_active', options.isActive)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch questionnaires:', error)
    return []
  }

  return (data ?? []).map(mapQuestionnaire)
}

export async function getQuestionnaireBySlug(
  slug: string
): Promise<QuestionnaireWithFields | null> {
  const supabase = await createClient()

  const { data: questionnaire, error: qError } = await supabase
    .from(Tables.questionnaires)
    .select('*')
    .eq('slug', slug)
    .single()

  if (qError || !questionnaire) {
    console.error('Failed to fetch questionnaire:', qError)
    return null
  }

  const { data: fields, error: fError } = await supabase
    .from(Tables.questionnaire_fields)
    .select('*')
    .eq('questionnaire_id', questionnaire.id)
    .order('display_order', { ascending: true })

  if (fError) {
    console.error('Failed to fetch fields:', fError)
    return null
  }

  return {
    ...mapQuestionnaire(questionnaire),
    fields: (fields ?? []).map(mapField),
  }
}

export async function getQuestionnaireById(
  id: string
): Promise<QuestionnaireWithFields | null> {
  const supabase = await createClient()

  const { data: questionnaire, error: qError } = await supabase
    .from(Tables.questionnaires)
    .select('*')
    .eq('id', id)
    .single()

  if (qError || !questionnaire) {
    console.error('Failed to fetch questionnaire:', qError)
    return null
  }

  const { data: fields, error: fError } = await supabase
    .from(Tables.questionnaire_fields)
    .select('*')
    .eq('questionnaire_id', questionnaire.id)
    .order('display_order', { ascending: true })

  if (fError) {
    console.error('Failed to fetch fields:', fError)
    return null
  }

  return {
    ...mapQuestionnaire(questionnaire),
    fields: (fields ?? []).map(mapField),
  }
}

export async function createQuestionnaire(
  input: CreateQuestionnaireInput
): Promise<{ success: boolean; data?: Questionnaire; error?: string }> {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from(Tables.questionnaires)
      .insert({
        slug: input.slug,
        name: input.name,
        description: input.description,
        category: input.category,
        tags: (input.tags ?? []) as unknown as Json,
        settings: (input.settings ?? {}) as unknown as Json,
        display_order: input.display_order ?? 0,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/questionnaires')
    revalidatePath('/assessment')

    return { success: true, data: mapQuestionnaire(data) }
  } catch (error) {
    console.error('Failed to create questionnaire:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create questionnaire',
    }
  }
}

export async function updateQuestionnaire(
  input: UpdateQuestionnaireInput
): Promise<{ success: boolean; data?: Questionnaire; error?: string }> {
  try {
    const supabase = await createClient()

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (input.slug !== undefined) updates.slug = input.slug
    if (input.name !== undefined) updates.name = input.name
    if (input.description !== undefined) updates.description = input.description
    if (input.category !== undefined) updates.category = input.category
    if (input.tags !== undefined) updates.tags = input.tags
    if (input.settings !== undefined) updates.settings = input.settings
    if (input.is_active !== undefined) updates.is_active = input.is_active
    if (input.display_order !== undefined) updates.display_order = input.display_order

    const { data, error } = await supabase
      .from(Tables.questionnaires)
      .update(updates)
      .eq('id', input.id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/questionnaires')
    revalidatePath('/assessment')

    return { success: true, data: mapQuestionnaire(data) }
  } catch (error) {
    console.error('Failed to update questionnaire:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update questionnaire',
    }
  }
}

export async function deleteQuestionnaire(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from(Tables.questionnaires)
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/questionnaires')
    revalidatePath('/assessment')

    return { success: true }
  } catch (error) {
    console.error('Failed to delete questionnaire:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete questionnaire',
    }
  }
}

// ============================================
// FIELD CRUD
// ============================================

export async function createField(
  input: CreateFieldInput
): Promise<{ success: boolean; data?: QuestionnaireField; error?: string }> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from(Tables.questionnaire_fields)
      .insert({
        questionnaire_id: input.questionnaire_id,
        slug: input.slug,
        label: input.label,
        field_type: input.field_type,
        config: (input.config ?? {}) as unknown as Json,
        is_required: input.is_required ?? false,
        display_order: input.display_order ?? 0,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/questionnaires')

    return { success: true, data: mapField(data) }
  } catch (error) {
    console.error('Failed to create field:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create field',
    }
  }
}

export async function updateField(
  input: UpdateFieldInput
): Promise<{ success: boolean; data?: QuestionnaireField; error?: string }> {
  try {
    const supabase = await createClient()

    const updates: Record<string, unknown> = {}

    if (input.slug !== undefined) updates.slug = input.slug
    if (input.label !== undefined) updates.label = input.label
    if (input.field_type !== undefined) updates.field_type = input.field_type
    if (input.config !== undefined) updates.config = input.config
    if (input.is_required !== undefined) updates.is_required = input.is_required
    if (input.display_order !== undefined) updates.display_order = input.display_order

    const { data, error } = await supabase
      .from(Tables.questionnaire_fields)
      .update(updates)
      .eq('id', input.id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/questionnaires')

    return { success: true, data: mapField(data) }
  } catch (error) {
    console.error('Failed to update field:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update field',
    }
  }
}

export async function deleteField(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from(Tables.questionnaire_fields)
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/questionnaires')

    return { success: true }
  } catch (error) {
    console.error('Failed to delete field:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete field',
    }
  }
}

// ============================================
// RESPONSE CRUD
// ============================================

export async function getResponses(
  options: ResponseFilterOptions
): Promise<QuestionnaireResponse[]> {
  const supabase = await createClient()

  let query = supabase
    .from(Tables.questionnaire_responses)
    .select('*')
    .order('created_at', { ascending: false })

  if (options.questionnaire_id) {
    query = query.eq('questionnaire_id', options.questionnaire_id)
  }

  if (options.target_type) {
    query = query.eq('target_type', options.target_type)
  }

  if (options.target_id) {
    query = query.eq('target_id', options.target_id)
  }

  if (options.respondent_id) {
    query = query.eq('respondent_id', options.respondent_id)
  }

  if (options.status) {
    query = query.eq('status', options.status)
  }

  if (!options.includeDeleted) {
    query = query.is('deleted_at', null)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch responses:', error)
    return []
  }

  return (data ?? []).map(mapResponse)
}

export async function getResponseById(
  id: string
): Promise<QuestionnaireResponse | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(Tables.questionnaire_responses)
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Failed to fetch response:', error)
    return null
  }

  return mapResponse(data)
}

export async function getResponseForTarget(
  questionnaireId: string,
  targetType: string,
  targetId: string,
  respondentId?: string
): Promise<QuestionnaireResponse | null> {
  const supabase = await createClient()

  let query = supabase
    .from(Tables.questionnaire_responses)
    .select('*')
    .eq('questionnaire_id', questionnaireId)
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .is('deleted_at', null)

  if (respondentId) {
    query = query.eq('respondent_id', respondentId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('Failed to fetch response:', error)
    return null
  }

  return data ? mapResponse(data) : null
}

export async function createOrUpdateResponse(
  input: CreateResponseInput
): Promise<{ success: boolean; data?: QuestionnaireResponse; error?: string }> {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    // Defensive check: ensure target_id is not empty
    if (!input.target_id || input.target_id === '') {
      console.error('createOrUpdateResponse: target_id is empty or undefined', {
        questionnaire_id: input.questionnaire_id,
        target_type: input.target_type,
        target_id: input.target_id,
        userId,
      })
      return {
        success: false,
        error: 'User ID is required. Please ensure you are logged in.',
      }
    }

    // Check if response already exists
    const existing = await getResponseForTarget(
      input.questionnaire_id,
      input.target_type,
      input.target_id,
      input.respondent_id ?? userId ?? undefined
    )

    if (existing) {
      // Update existing
      return updateResponse({
        id: existing.id,
        answers: input.answers,
        status: input.status,
      })
    }

    // Create new
    const { data, error } = await supabase
      .from(Tables.questionnaire_responses)
      .insert({
        questionnaire_id: input.questionnaire_id,
        target_type: input.target_type,
        target_id: input.target_id,
        respondent_id: input.respondent_id ?? userId,
        answers: (input.answers ?? {}) as unknown as Json,
        status: input.status ?? 'draft',
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating response:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        input: {
          questionnaire_id: input.questionnaire_id,
          target_type: input.target_type,
          target_id: input.target_id,
        },
      })
      throw error
    }

    revalidatePath('/leads')
    revalidatePath('/assessment')
    revalidatePath('/tasks')

    return { success: true, data: mapResponse(data) }
  } catch (error) {
    console.error('Failed to create response:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create response',
    }
  }
}

export async function updateResponse(
  input: UpdateResponseInput
): Promise<{ success: boolean; data?: QuestionnaireResponse; error?: string }> {
  try {
    const supabase = await createClient()

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (input.answers !== undefined) updates.answers = input.answers
    if (input.status !== undefined) {
      updates.status = input.status
      if (input.status === 'completed') {
        updates.completed_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from(Tables.questionnaire_responses)
      .update(updates)
      .eq('id', input.id)
      .select()
      .single()

    if (error) throw error

    // If questionnaire was completed, send notification
    if (input.status === 'completed') {
      // Get questionnaire name
      const { data: questionnaire } = await supabase
        .from(Tables.questionnaires)
        .select('name')
        .eq('id', data.questionnaire_id)
        .single()

      await createNotificationForAllUsers({
        type: 'questionnaire_filled',
        title: `שאלון הושלם: ${questionnaire?.name ?? 'שאלון'}`,
        entity_type: 'questionnaire',
        entity_id: data.id,
        metadata: {
          questionnaire_name: questionnaire?.name,
        },
      })
    }

    revalidatePath('/leads')
    revalidatePath('/assessment')
    revalidatePath('/tasks')

    return { success: true, data: mapResponse(data) }
  } catch (error) {
    console.error('Failed to update response:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update response',
    }
  }
}

export async function saveAnswer(
  responseId: string,
  fieldSlug: string,
  value: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current answers
    const { data: response, error: fetchError } = await supabase
      .from(Tables.questionnaire_responses)
      .select('answers')
      .eq('id', responseId)
      .single()

    if (fetchError) throw fetchError

    // Merge new answer
    const answers = {
      ...(response.answers as Record<string, unknown> ?? {}),
      [fieldSlug]: value,
    }

    // Update
    const { error: updateError } = await supabase
      .from(Tables.questionnaire_responses)
      .update({
        answers: answers as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', responseId)

    if (updateError) throw updateError

    return { success: true }
  } catch (error) {
    console.error('Failed to save answer:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save answer',
    }
  }
}

export async function completeResponse(
  responseId: string
): Promise<{ success: boolean; error?: string }> {
  return updateResponse({
    id: responseId,
    status: 'completed',
  })
}

export async function deleteResponse(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Soft delete
    const { error } = await supabase
      .from(Tables.questionnaire_responses)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    revalidatePath('/leads')
    revalidatePath('/assessment')

    return { success: true }
  } catch (error) {
    console.error('Failed to delete response:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete response',
    }
  }
}

// ============================================
// HELPER: Get questionnaires status for a target
// ============================================

export async function getQuestionnairesStatusForTarget(
  targetType: string,
  targetId: string,
  category?: string
): Promise<{
  filled: Array<{ questionnaire: Questionnaire; response: QuestionnaireResponse }>
  unfilled: Questionnaire[]
}> {
  const supabase = await createClient()

  // Get all questionnaires for the category
  let questionnairesQuery = supabase
    .from(Tables.questionnaires)
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true })

  if (category) {
    questionnairesQuery = questionnairesQuery.eq('category', category)
  }

  const { data: questionnaires } = await questionnairesQuery

  // Get all responses for this target
  const { data: responses } = await supabase
    .from(Tables.questionnaire_responses)
    .select('*')
    .eq('target_type', targetType)
    .eq('target_id', targetId)
    .is('deleted_at', null)

  const responseMap = new Map(
    (responses ?? []).map(r => [r.questionnaire_id, mapResponse(r)])
  )

  const filled: Array<{ questionnaire: Questionnaire; response: QuestionnaireResponse }> = []
  const unfilled: Questionnaire[] = []

  for (const q of questionnaires ?? []) {
    const response = responseMap.get(q.id)
    if (response) {
      filled.push({ questionnaire: mapQuestionnaire(q), response })
    } else {
      unfilled.push(mapQuestionnaire(q))
    }
  }

  return { filled, unfilled }
}


// ============================================
// MAPPERS (DB row -> Type)
// ============================================

function mapQuestionnaire(row: Record<string, unknown>): Questionnaire {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: row.description as string | null,
    category: row.category as string | null,
    tags: (row.tags as string[]) ?? [],
    settings: (row.settings as Record<string, unknown>) ?? {},
    is_active: row.is_active as boolean,
    display_order: row.display_order as number,
    created_at: row.created_at as string | null,
    updated_at: row.updated_at as string | null,
    created_by: row.created_by as string | null,
  }
}

function mapField(row: Record<string, unknown>): QuestionnaireField {
  return {
    id: row.id as string,
    questionnaire_id: row.questionnaire_id as string,
    slug: row.slug as string,
    label: row.label as string,
    field_type: row.field_type as QuestionnaireField['field_type'],
    config: (row.config as FieldConfig) ?? {},
    is_required: row.is_required as boolean,
    display_order: row.display_order as number,
    created_at: row.created_at as string | null,
  }
}

function mapResponse(row: Record<string, unknown>): QuestionnaireResponse {
  return {
    id: row.id as string,
    questionnaire_id: row.questionnaire_id as string,
    target_type: row.target_type as string,
    target_id: row.target_id as string,
    respondent_id: row.respondent_id as string | null,
    answers: (row.answers as Answers) ?? {},
    status: row.status as QuestionnaireResponse['status'],
    started_at: row.started_at as string | null,
    completed_at: row.completed_at as string | null,
    created_at: row.created_at as string | null,
    updated_at: row.updated_at as string | null,
    deleted_at: row.deleted_at as string | null,
  }
}
