-- Create playbooks table for sales training guides
CREATE TABLE IF NOT EXISTS public.playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL DEFAULT '',          -- Markdown content
  description TEXT,                           -- Short description for grid
  category VARCHAR(100),                      -- Optional category
  is_default BOOLEAN DEFAULT FALSE,           -- Global default playbook
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL                 -- Soft delete
);

-- Create indexes
CREATE INDEX idx_playbooks_created_at ON public.playbooks(created_at DESC);
CREATE INDEX idx_playbooks_is_default ON public.playbooks(is_default) WHERE is_default = true AND deleted_at IS NULL;
CREATE INDEX idx_playbooks_category ON public.playbooks(category) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
DROP POLICY IF EXISTS "auth_select_playbooks" ON public.playbooks;
CREATE POLICY "auth_select_playbooks" ON public.playbooks
FOR SELECT TO authenticated
USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "auth_insert_playbooks" ON public.playbooks;
CREATE POLICY "auth_insert_playbooks" ON public.playbooks
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "auth_update_playbooks" ON public.playbooks;
CREATE POLICY "auth_update_playbooks" ON public.playbooks
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_playbooks" ON public.playbooks;
CREATE POLICY "auth_delete_playbooks" ON public.playbooks
FOR DELETE TO authenticated
USING (true);

-- Grant permissions
GRANT SELECT ON public.playbooks TO authenticated;
GRANT INSERT ON public.playbooks TO authenticated;
GRANT UPDATE ON public.playbooks TO authenticated;
GRANT DELETE ON public.playbooks TO authenticated;

-- Create updated_at trigger (reuses function from previous migrations)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_playbooks_updated_at ON public.playbooks;
CREATE TRIGGER update_playbooks_updated_at
    BEFORE UPDATE ON public.playbooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one default playbook
CREATE OR REPLACE FUNCTION ensure_single_default_playbook()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true AND NEW.deleted_at IS NULL THEN
        UPDATE public.playbooks
        SET is_default = false
        WHERE id != NEW.id AND is_default = true AND deleted_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS ensure_single_default_playbook_trigger ON public.playbooks;
CREATE TRIGGER ensure_single_default_playbook_trigger
    BEFORE INSERT OR UPDATE ON public.playbooks
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_playbook();
