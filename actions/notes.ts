'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/tables'
import { getOrCreateUserProfile, getUserProfiles, type UserProfile } from './user-profile'

// Note type with user profile for display
export interface NoteWithUser {
  id: string
  lead_id: string
  content: string
  user_id: string
  created_at: string | null
  updated_at: string | null
  user_display_name: string
  user_email: string
}

// Helper to get current user ID
async function getCurrentUserId(): Promise<string | null> {
  // Dev bypass - return dev user ID
  if (process.env.BYPASS_AUTH === 'true') {
    return '00000000-0000-0000-0000-000000000000'
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

// Helper to get current user email for event logging
async function getCurrentUserEmail(): Promise<string | null> {
  if (process.env.BYPASS_AUTH === 'true') {
    return 'dev@example.com'
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email ?? null
}

/**
 * Create a new note for a lead
 */
export async function createNote(
  leadId: string,
  content: string
): Promise<{
  success: boolean
  data?: NoteWithUser
  error?: string
}> {
  try {
    const userId = await getCurrentUserId()
    const userEmail = await getCurrentUserEmail()

    if (!userId) {
      return { success: false, error: 'User not authenticated' }
    }

    // Validate content
    const trimmedContent = content.trim()
    if (!trimmedContent) {
      return { success: false, error: 'Note content cannot be empty' }
    }

    // Ensure user has a profile
    const profileResult = await getOrCreateUserProfile()
    if (!profileResult.success || !profileResult.data) {
      return { success: false, error: 'Failed to get user profile' }
    }

    const supabase = await createClient()

    // Create the note
    const { data: note, error } = await supabase
      .from(Tables.lead_notes)
      .insert({
        lead_id: leadId,
        content: trimmedContent,
        user_id: userId,
      })
      .select()
      .single()

    if (error) throw error

    // Log note creation event
    await supabase.from(Tables.lead_events).insert({
      lead_id: leadId,
      event_type: 'note_added',
      user_email: userEmail,
      new_value: trimmedContent.substring(0, 100) + (trimmedContent.length > 100 ? '...' : ''),
      metadata: {
        note_id: note.id,
        user_display_name: profileResult.data.display_name,
      },
    })

    revalidatePath(`/leads/${leadId}`)

    return {
      success: true,
      data: {
        ...note,
        user_display_name: profileResult.data.display_name,
        user_email: profileResult.data.email,
      },
    }
  } catch (error) {
    console.error('Failed to create note:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create note',
    }
  }
}

/**
 * Get all notes for a lead with user profiles
 */
export async function getNotes(leadId: string): Promise<NoteWithUser[]> {
  const supabase = await createClient()

  const { data: notes, error } = await supabase
    .from(Tables.lead_notes)
    .select('*')
    .eq('lead_id', leadId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch notes:', error)
    return []
  }

  if (!notes || notes.length === 0) {
    return []
  }

  // Get unique user IDs
  const userIds = Array.from(new Set(notes.map(n => n.user_id)))

  // Fetch user profiles
  const profilesMap = await getUserProfiles(userIds)

  // Combine notes with user profiles
  return notes.map(note => {
    const profile = profilesMap.get(note.user_id)
    return {
      ...note,
      user_display_name: profile?.display_name ?? 'Unknown User',
      user_email: profile?.email ?? '',
    }
  })
}

/**
 * Update a note (only the author can update)
 */
export async function updateNote(
  noteId: string,
  content: string
): Promise<{
  success: boolean
  data?: NoteWithUser
  error?: string
}> {
  try {
    const userId = await getCurrentUserId()
    const userEmail = await getCurrentUserEmail()

    if (!userId) {
      return { success: false, error: 'User not authenticated' }
    }

    // Validate content
    const trimmedContent = content.trim()
    if (!trimmedContent) {
      return { success: false, error: 'Note content cannot be empty' }
    }

    const supabase = await createClient()

    // Get the note to verify ownership and get lead_id
    const { data: existingNote } = await supabase
      .from(Tables.lead_notes)
      .select('*')
      .eq('id', noteId)
      .single()

    if (!existingNote) {
      return { success: false, error: 'Note not found' }
    }

    if (existingNote.user_id !== userId) {
      return { success: false, error: 'You can only edit your own notes' }
    }

    // Update the note
    const { data: updated, error } = await supabase
      .from(Tables.lead_notes)
      .update({ content: trimmedContent })
      .eq('id', noteId)
      .eq('user_id', userId) // Extra safety check
      .select()
      .single()

    if (error) throw error

    // Log note update event
    await supabase.from(Tables.lead_events).insert({
      lead_id: existingNote.lead_id,
      event_type: 'note_updated',
      user_email: userEmail,
      old_value: existingNote.content.substring(0, 50) + '...',
      new_value: trimmedContent.substring(0, 50) + '...',
      metadata: {
        note_id: noteId,
      },
    })

    // Get user profile for response
    const profileResult = await getOrCreateUserProfile()

    revalidatePath(`/leads/${existingNote.lead_id}`)

    return {
      success: true,
      data: {
        ...updated,
        user_display_name: profileResult.data?.display_name ?? 'Unknown User',
        user_email: profileResult.data?.email ?? '',
      },
    }
  } catch (error) {
    console.error('Failed to update note:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update note',
    }
  }
}

/**
 * Soft delete a note (only the author can delete)
 */
export async function deleteNote(noteId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const userId = await getCurrentUserId()
    const userEmail = await getCurrentUserEmail()

    if (!userId) {
      return { success: false, error: 'User not authenticated' }
    }

    const supabase = await createClient()

    // Get the note to verify ownership and get lead_id
    const { data: existingNote } = await supabase
      .from(Tables.lead_notes)
      .select('*')
      .eq('id', noteId)
      .single()

    if (!existingNote) {
      return { success: false, error: 'Note not found' }
    }

    if (existingNote.user_id !== userId) {
      return { success: false, error: 'You can only delete your own notes' }
    }

    // Soft delete
    const { error } = await supabase
      .from(Tables.lead_notes)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', noteId)
      .eq('user_id', userId) // Extra safety check

    if (error) throw error

    // Log note deletion event
    await supabase.from(Tables.lead_events).insert({
      lead_id: existingNote.lead_id,
      event_type: 'note_deleted',
      user_email: userEmail,
      old_value: existingNote.content.substring(0, 50) + '...',
      metadata: {
        note_id: noteId,
      },
    })

    revalidatePath(`/leads/${existingNote.lead_id}`)

    return { success: true }
  } catch (error) {
    console.error('Failed to delete note:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete note',
    }
  }
}

/**
 * Get note counts for multiple leads efficiently
 * Returns a Map of lead_id -> note count
 */
export async function getNoteCountsForLeads(leadIds: string[]): Promise<Map<string, number>> {
  if (leadIds.length === 0) {
    return new Map()
  }

  const supabase = await createClient()

  // Query to count notes per lead, excluding deleted notes
  const { data, error } = await supabase
    .from(Tables.lead_notes)
    .select('lead_id')
    .in('lead_id', leadIds)
    .is('deleted_at', null)

  if (error) {
    console.error('Failed to fetch note counts:', error)
    return new Map()
  }

  // Count notes per lead
  const countMap = new Map<string, number>()
  for (const note of data || []) {
    const currentCount = countMap.get(note.lead_id) || 0
    countMap.set(note.lead_id, currentCount + 1)
  }

  return countMap
}
