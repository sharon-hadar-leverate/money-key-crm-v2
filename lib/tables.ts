// Helper to switch between dev and prod tables based on BYPASS_AUTH
// Dev tables don't have RLS, allowing unauthenticated access for testing

export function getTableNames() {
  const isDev = process.env.BYPASS_AUTH === 'true'

  return {
    leads: isDev ? 'dev_leads' : 'leads',
    lead_events: isDev ? 'dev_lead_events' : 'lead_events',
    user_profiles: isDev ? 'dev_user_profiles' : 'user_profiles',
    lead_notes: isDev ? 'dev_lead_notes' : 'lead_notes',
    playbooks: isDev ? 'dev_playbooks' : 'playbooks',
  }
}

// Use type assertions to allow dynamic table names
// In dev mode, we use dev_leads/dev_lead_events which have same structure
export const Tables = {
  get leads(): 'leads' {
    return (process.env.BYPASS_AUTH === 'true' ? 'dev_leads' : 'leads') as 'leads'
  },
  get lead_events(): 'lead_events' {
    return (process.env.BYPASS_AUTH === 'true' ? 'dev_lead_events' : 'lead_events') as 'lead_events'
  },
  get user_profiles(): 'user_profiles' {
    return (process.env.BYPASS_AUTH === 'true' ? 'dev_user_profiles' : 'user_profiles') as 'user_profiles'
  },
  get lead_notes(): 'lead_notes' {
    return (process.env.BYPASS_AUTH === 'true' ? 'dev_lead_notes' : 'lead_notes') as 'lead_notes'
  },
  get playbooks(): 'playbooks' {
    return (process.env.BYPASS_AUTH === 'true' ? 'dev_playbooks' : 'playbooks') as 'playbooks'
  },
}
