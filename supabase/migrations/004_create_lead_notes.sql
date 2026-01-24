-- Migration: Create lead_notes table for storing notes with user attribution
-- Notes support soft delete and are linked to both leads and users

-- Create lead_notes table
CREATE TABLE IF NOT EXISTS public.lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  user_id UUID NOT NULL,  -- References auth.users.id
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL  -- Soft delete
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON public.lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_created_at ON public.lead_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_notes_user_id ON public.lead_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_notes_deleted_at ON public.lead_notes(deleted_at) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies - authenticated users can read all non-deleted notes
CREATE POLICY "auth_select_lead_notes" ON public.lead_notes
FOR SELECT TO authenticated
USING (deleted_at IS NULL);

-- Authenticated users can insert notes
CREATE POLICY "auth_insert_lead_notes" ON public.lead_notes
FOR INSERT TO authenticated
WITH CHECK (true);

-- Users can only update their own notes
CREATE POLICY "auth_update_lead_notes" ON public.lead_notes
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.lead_notes TO authenticated;
GRANT INSERT ON public.lead_notes TO authenticated;
GRANT UPDATE ON public.lead_notes TO authenticated;

-- Create updated_at trigger (reuse function from user_profiles migration)
CREATE TRIGGER update_lead_notes_updated_at
    BEFORE UPDATE ON public.lead_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
