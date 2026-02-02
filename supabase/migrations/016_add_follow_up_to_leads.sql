-- Migration: 016_add_follow_up_to_leads.sql
-- Add follow_up_at column for scheduling follow-up dates

ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ;
ALTER TABLE dev_leads ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ;

-- Create index for efficient querying of upcoming follow-ups
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(follow_up_at)
  WHERE follow_up_at IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dev_leads_follow_up ON dev_leads(follow_up_at)
  WHERE follow_up_at IS NOT NULL AND deleted_at IS NULL;

COMMENT ON COLUMN leads.follow_up_at IS 'Scheduled follow-up date/time';
COMMENT ON COLUMN dev_leads.follow_up_at IS 'Scheduled follow-up date/time';
