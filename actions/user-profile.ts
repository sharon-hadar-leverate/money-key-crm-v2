'use server'

import { createClient } from '@/lib/supabase/server'
import { Tables } from '@/lib/tables'

// Types for user profile
export interface UserProfile {
  id: string
  user_id: string
  email: string
  display_name: string
  created_at: string | null
  updated_at: string | null
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

// Helper to get current user email
async function getCurrentUserEmail(): Promise<string | null> {
  // Dev bypass - return dev email
  if (process.env.BYPASS_AUTH === 'true') {
    return 'dev@example.com'
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email ?? null
}

/**
 * Generate a default display name from email
 * Takes the part before @ and formats it nicely
 */
function generateDisplayNameFromEmail(email: string): string {
  const localPart = email.split('@')[0]
  // Replace dots and underscores with spaces, capitalize each word
  return localPart
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Get or create a user profile for the current user
 * If profile doesn't exist, creates one with auto-generated display name
 */
export async function getOrCreateUserProfile(): Promise<{
  success: boolean
  data?: UserProfile
  error?: string
}> {
  try {
    const userId = await getCurrentUserId()
    const userEmail = await getCurrentUserEmail()

    if (!userId || !userEmail) {
      return { success: false, error: 'User not authenticated' }
    }

    const supabase = await createClient()

    // First, try to get existing profile
    const { data: existing } = await supabase
      .from(Tables.user_profiles)
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existing) {
      return { success: true, data: existing }
    }

    // Profile doesn't exist, create one with auto-generated display name
    const displayName = generateDisplayNameFromEmail(userEmail)

    const { data: created, error } = await supabase
      .from(Tables.user_profiles)
      .insert({
        user_id: userId,
        email: userEmail,
        display_name: displayName,
      })
      .select()
      .single()

    if (error) {
      // Handle race condition - profile might have been created by another request
      if (error.code === '23505') { // unique_violation
        const { data: existingAfterError } = await supabase
          .from(Tables.user_profiles)
          .select('*')
          .eq('user_id', userId)
          .single()

        if (existingAfterError) {
          return { success: true, data: existingAfterError }
        }
      }
      throw error
    }

    return { success: true, data: created }
  } catch (error) {
    console.error('Failed to get or create user profile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user profile',
    }
  }
}

/**
 * Get a user profile by user ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from(Tables.user_profiles)
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Failed to fetch user profile:', error)
    return null
  }

  return data
}

/**
 * Get multiple user profiles by user IDs
 */
export async function getUserProfiles(userIds: string[]): Promise<Map<string, UserProfile>> {
  if (userIds.length === 0) {
    return new Map()
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from(Tables.user_profiles)
    .select('*')
    .in('user_id', userIds)

  if (error) {
    console.error('Failed to fetch user profiles:', error)
    return new Map()
  }

  const profileMap = new Map<string, UserProfile>()
  data?.forEach(profile => {
    profileMap.set(profile.user_id, profile)
  })

  return profileMap
}

/**
 * Update the display name of the current user
 */
export async function updateDisplayName(displayName: string): Promise<{
  success: boolean
  data?: UserProfile
  error?: string
}> {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return { success: false, error: 'User not authenticated' }
    }

    // Validate display name
    const trimmed = displayName.trim()
    if (!trimmed || trimmed.length < 2) {
      return { success: false, error: 'Display name must be at least 2 characters' }
    }
    if (trimmed.length > 50) {
      return { success: false, error: 'Display name must be at most 50 characters' }
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from(Tables.user_profiles)
      .update({ display_name: trimmed })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Failed to update display name:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update display name',
    }
  }
}
