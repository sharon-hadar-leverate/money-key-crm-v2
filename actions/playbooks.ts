'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/tables'
import type { Playbook, CreatePlaybookInput, UpdatePlaybookInput } from '@/types/playbooks'

// Helper to get current user ID for audit trail
async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // For dev mode without auth, use a default UUID
  return user?.id ?? '00000000-0000-0000-0000-000000000000'
}

// ============ CREATE ============
export async function createPlaybook(input: CreatePlaybookInput): Promise<{
  success: boolean
  data?: Playbook
  error?: string
}> {
  try {
    const supabase = await createClient()
    const userId = await getCurrentUserId()

    const { data, error } = await supabase
      .from(Tables.playbooks)
      .insert({
        name: input.name,
        content: input.content ?? '',
        description: input.description,
        category: input.category,
        is_default: input.is_default ?? false,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/playbooks')

    return { success: true, data }
  } catch (error) {
    console.error('Failed to create playbook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create playbook',
    }
  }
}

// ============ READ ============
export async function getPlaybooks(): Promise<Playbook[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(Tables.playbooks)
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch playbooks:', error)
    return []
  }

  return data ?? []
}

export async function getPlaybook(id: string): Promise<Playbook | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(Tables.playbooks)
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('Failed to fetch playbook:', error)
    return null
  }

  return data
}

export async function getDefaultPlaybook(): Promise<Playbook | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(Tables.playbooks)
    .select('*')
    .eq('is_default', true)
    .is('deleted_at', null)
    .single()

  if (error) {
    // No default playbook set is not an error
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Failed to fetch default playbook:', error)
    return null
  }

  return data
}

// ============ UPDATE ============
export async function updatePlaybook(input: UpdatePlaybookInput): Promise<{
  success: boolean
  data?: Playbook
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Get current playbook for comparison
    const { data: current } = await supabase
      .from(Tables.playbooks)
      .select('*')
      .eq('id', input.id)
      .is('deleted_at', null)
      .single()

    if (!current) {
      return { success: false, error: 'Playbook not found' }
    }

    // Build update object only with changed fields
    const updates: Record<string, unknown> = {}

    if (input.name !== undefined && input.name !== current.name) {
      updates.name = input.name
    }
    if (input.content !== undefined && input.content !== current.content) {
      updates.content = input.content
    }
    if (input.description !== undefined && input.description !== current.description) {
      updates.description = input.description
    }
    if (input.category !== undefined && input.category !== current.category) {
      updates.category = input.category
    }
    if (input.is_default !== undefined && input.is_default !== current.is_default) {
      updates.is_default = input.is_default
    }

    if (Object.keys(updates).length === 0) {
      return { success: true, data: current }
    }

    const { data, error } = await supabase
      .from(Tables.playbooks)
      .update(updates)
      .eq('id', input.id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/playbooks')
    revalidatePath(`/playbooks/${input.id}`)

    return { success: true, data }
  } catch (error) {
    console.error('Failed to update playbook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update playbook',
    }
  }
}

// ============ DELETE ============
export async function deletePlaybook(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Soft delete by setting deleted_at
    const { error } = await supabase
      .from(Tables.playbooks)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) throw error

    revalidatePath('/playbooks')

    return { success: true }
  } catch (error) {
    console.error('Failed to delete playbook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete playbook',
    }
  }
}

// ============ LEAD PLAYBOOK ASSIGNMENT ============
export async function setLeadPlaybook(
  leadId: string,
  playbookId: string | null
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from(Tables.leads)
      .update({ playbook_id: playbookId })
      .eq('id', leadId)

    if (error) throw error

    revalidatePath(`/leads/${leadId}`)

    return { success: true }
  } catch (error) {
    console.error('Failed to set lead playbook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set lead playbook',
    }
  }
}

export async function getPlaybookForLead(leadId: string): Promise<Playbook | null> {
  const supabase = await createClient()

  // First try to get the lead's assigned playbook
  const { data: lead } = await supabase
    .from(Tables.leads)
    .select('playbook_id')
    .eq('id', leadId)
    .single()

  if (lead?.playbook_id) {
    const playbook = await getPlaybook(lead.playbook_id)
    if (playbook) return playbook
  }

  // Fall back to default playbook
  return getDefaultPlaybook()
}
