-- Add playbook_id column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS playbook_id UUID REFERENCES public.playbooks(id);

-- Create index for playbook lookups
CREATE INDEX IF NOT EXISTS idx_leads_playbook_id ON public.leads(playbook_id) WHERE playbook_id IS NOT NULL;

-- Add to dev_leads table as well
ALTER TABLE public.dev_leads ADD COLUMN IF NOT EXISTS playbook_id UUID;
