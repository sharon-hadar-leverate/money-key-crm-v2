-- WhatsApp outreach tracking table for no-answer re-engagement automation
-- Tracks messages sent via Green API and reply detection

CREATE TABLE IF NOT EXISTS whatsapp_outreach (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    message_number INT NOT NULL CHECK (message_number IN (1, 2)),
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    message_text TEXT,
    whatsapp_verified BOOLEAN DEFAULT TRUE,
    replied BOOLEAN DEFAULT FALSE,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient lookups by lead
CREATE INDEX idx_whatsapp_outreach_lead_id ON whatsapp_outreach(lead_id);

-- Index for finding leads that need Day 2 follow-up
CREATE INDEX idx_whatsapp_outreach_message_number ON whatsapp_outreach(message_number, sent_at);

-- Enable RLS
ALTER TABLE whatsapp_outreach ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (automation runs with service key)
CREATE POLICY "Service role full access" ON whatsapp_outreach
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Authenticated users can read (for CRM UI visibility)
CREATE POLICY "Authenticated users can read" ON whatsapp_outreach
    FOR SELECT
    USING (auth.role() = 'authenticated');
