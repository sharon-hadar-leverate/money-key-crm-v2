-- Create dev_leads table with same structure as leads (no RLS for testing)
CREATE TABLE IF NOT EXISTS dev_leads (
  LIKE leads INCLUDING ALL
);

-- Disable RLS on dev_leads
ALTER TABLE dev_leads DISABLE ROW LEVEL SECURITY;

-- Copy leads from last 7 days
INSERT INTO dev_leads
SELECT * FROM leads
WHERE created_at >= NOW() - INTERVAL '7 days'
AND deleted_at IS NULL;

-- Grant read access to anon role (for unauthenticated access)
GRANT SELECT ON dev_leads TO anon;
GRANT SELECT ON dev_leads TO authenticated;

-- Also create dev_lead_events for the activity timeline
CREATE TABLE IF NOT EXISTS dev_lead_events (
  LIKE lead_events INCLUDING ALL
);

ALTER TABLE dev_lead_events DISABLE ROW LEVEL SECURITY;

INSERT INTO dev_lead_events
SELECT * FROM lead_events
WHERE created_at >= NOW() - INTERVAL '7 days';

GRANT SELECT ON dev_lead_events TO anon;
GRANT SELECT ON dev_lead_events TO authenticated;
