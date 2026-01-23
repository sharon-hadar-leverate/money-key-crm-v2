import { createClient, SupabaseClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables (needed for Playwright worker processes)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

/**
 * Get table name based on BYPASS_AUTH setting
 * When BYPASS_AUTH=true, app uses dev_* tables which don't have RLS
 */
function getTableName(baseName: string): string {
  const isDev = process.env.BYPASS_AUTH === 'true'
  console.log(`[test-data] BYPASS_AUTH=${process.env.BYPASS_AUTH}, using table: ${isDev ? `dev_${baseName}` : baseName}`)
  return isDev ? `dev_${baseName}` : baseName
}

const LEADS_TABLE = () => getTableName('leads')
const LEAD_EVENTS_TABLE = () => getTableName('lead_events')

// Lazy-initialized Supabase client
let _supabase: SupabaseClient | null = null

/**
 * Check if Supabase service role key is properly configured
 */
export function isSupabaseConfigured(): boolean {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return serviceKey.startsWith('eyJ')
}

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Missing Supabase environment variables. ' +
        'Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
      )
    }

    if (!supabaseServiceKey.startsWith('eyJ')) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY appears to be a placeholder. ' +
        'Get your service role key from Supabase Dashboard > Settings > API'
      )
    }

    _supabase = createClient(supabaseUrl, supabaseServiceKey)
  }
  return _supabase
}

export interface TestLead {
  id?: string
  name: string
  email?: string
  phone?: string
  status?: 'new' | 'contacted' | 'customer' | 'lost'
  expected_revenue?: number
  probability?: number
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

/**
 * Create a test lead directly in the database
 */
export async function seedTestLead(overrides?: Partial<TestLead>): Promise<TestLead> {
  const supabase = getSupabase()
  const timestamp = Date.now()
  const lead: TestLead = {
    name: `Test Lead ${timestamp}`,
    email: `test${timestamp}@example.com`,
    phone: '0501234567',
    status: 'new',
    expected_revenue: 10000,
    probability: 50,
    ...overrides,
  }

  const { data, error } = await supabase
    .from(LEADS_TABLE())
    .insert(lead)
    .select()
    .single()

  if (error) throw new Error(`Failed to seed lead: ${error.message}`)
  return data
}

/**
 * Create multiple test leads for dashboard testing
 */
export async function seedDashboardLeads(): Promise<TestLead[]> {
  const timestamp = Date.now()
  const leads: TestLead[] = [
    { name: `Test New 1 ${timestamp}`, status: 'new', utm_source: 'google', expected_revenue: 5000 },
    { name: `Test New 2 ${timestamp}`, status: 'new', utm_source: 'google', expected_revenue: 7000 },
    { name: `Test New 3 ${timestamp}`, status: 'new', utm_source: 'facebook', expected_revenue: 3000 },
    { name: `Test Contacted 1 ${timestamp}`, status: 'contacted', utm_source: 'facebook', expected_revenue: 10000 },
    { name: `Test Contacted 2 ${timestamp}`, status: 'contacted', utm_source: 'direct', expected_revenue: 15000 },
    { name: `Test Customer 1 ${timestamp}`, status: 'customer', utm_source: 'direct', expected_revenue: 25000 },
  ]

  const results: TestLead[] = []
  for (const lead of leads) {
    const seeded = await seedTestLead(lead)
    results.push(seeded)
  }

  return results
}

/**
 * Get a lead directly from the database
 */
export async function getLeadFromDB(id: string): Promise<TestLead | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from(LEADS_TABLE())
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

/**
 * Get lead events from the database
 */
export async function getLeadEventsFromDB(leadId: string) {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from(LEAD_EVENTS_TABLE())
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}

/**
 * Get current lead counts by status from the database
 */
export async function getLeadCountsByStatus(): Promise<Record<string, number>> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from(LEADS_TABLE())
    .select('status')
    .is('deleted_at', null)

  if (error) return {}

  const counts: Record<string, number> = {
    new: 0,
    contacted: 0,
    customer: 0,
    lost: 0,
  }

  data.forEach((lead: { status: string }) => {
    if (counts[lead.status] !== undefined) {
      counts[lead.status]++
    }
  })

  return counts
}

/**
 * Clean up test leads by name pattern
 */
export async function cleanupTestLeads(namePattern = 'Test'): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from(LEADS_TABLE())
    .delete()
    .ilike('name', `${namePattern}%`)

  if (error) console.error('Cleanup error:', error.message)
}

/**
 * Delete a specific lead by ID
 */
export async function deleteTestLead(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from(LEADS_TABLE())
    .delete()
    .eq('id', id)

  if (error) console.error('Delete error:', error.message)
}
