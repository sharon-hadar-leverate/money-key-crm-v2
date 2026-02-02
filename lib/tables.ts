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
    questionnaires: isDev ? 'dev_questionnaires' : 'questionnaires',
    questionnaire_fields: isDev ? 'dev_questionnaire_fields' : 'questionnaire_fields',
    questionnaire_responses: isDev ? 'dev_questionnaire_responses' : 'questionnaire_responses',
    notifications: isDev ? 'dev_notifications' : 'notifications',
    tasks: isDev ? 'dev_tasks' : 'tasks',
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
  // Questionnaire tables
  get questionnaires(): 'questionnaires' {
    return (process.env.BYPASS_AUTH === 'true' ? 'dev_questionnaires' : 'questionnaires') as 'questionnaires'
  },
  get questionnaire_fields(): 'questionnaire_fields' {
    return (process.env.BYPASS_AUTH === 'true' ? 'dev_questionnaire_fields' : 'questionnaire_fields') as 'questionnaire_fields'
  },
  get questionnaire_responses(): 'questionnaire_responses' {
    return (process.env.BYPASS_AUTH === 'true' ? 'dev_questionnaire_responses' : 'questionnaire_responses') as 'questionnaire_responses'
  },
  // Notification tables
  get notifications(): 'notifications' {
    return (process.env.BYPASS_AUTH === 'true' ? 'dev_notifications' : 'notifications') as 'notifications'
  },
  // Task tables
  get tasks(): 'tasks' {
    return (process.env.BYPASS_AUTH === 'true' ? 'dev_tasks' : 'tasks') as 'tasks'
  },
}
