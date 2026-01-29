-- Add whatsapp_avatar_url column to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS whatsapp_avatar_url TEXT;

-- Add to dev_leads table as well
ALTER TABLE public.dev_leads ADD COLUMN IF NOT EXISTS whatsapp_avatar_url TEXT;
