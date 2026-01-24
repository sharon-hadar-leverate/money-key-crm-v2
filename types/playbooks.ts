import type { Database } from './database'

// Base types from database
export type Playbook = Database['public']['Tables']['playbooks']['Row']
export type PlaybookInsert = Database['public']['Tables']['playbooks']['Insert']
export type PlaybookUpdate = Database['public']['Tables']['playbooks']['Update']

// Application types
export interface CreatePlaybookInput {
  name: string
  content?: string
  description?: string
  category?: string
  is_default?: boolean
}

export interface UpdatePlaybookInput {
  id: string
  name?: string
  content?: string
  description?: string
  category?: string
  is_default?: boolean
}

// Playbook categories for filtering
export const PLAYBOOK_CATEGORIES = [
  { value: 'sales', label: 'מכירות' },
  { value: 'onboarding', label: 'קליטה' },
  { value: 'support', label: 'תמיכה' },
  { value: 'followup', label: 'מעקב' },
  { value: 'other', label: 'אחר' },
] as const

export type PlaybookCategory = typeof PLAYBOOK_CATEGORIES[number]['value']
