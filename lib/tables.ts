// Helper to switch between dev and prod tables based on BYPASS_AUTH
// Dev tables don't have RLS, allowing unauthenticated access for testing

export function getTableNames() {
  const isDev = process.env.BYPASS_AUTH === 'true'

  return {
    leads: isDev ? 'dev_leads' : 'leads',
    lead_events: isDev ? 'dev_lead_events' : 'lead_events',
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
}
