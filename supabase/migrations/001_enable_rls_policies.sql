-- Migration: Enable RLS and create access policies
-- Run this in Supabase Dashboard > SQL Editor

-- Enable RLS on both tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first (clean slate)
DROP POLICY IF EXISTS "auth_select_leads" ON public.leads;
DROP POLICY IF EXISTS "auth_insert_leads" ON public.leads;
DROP POLICY IF EXISTS "auth_update_leads" ON public.leads;
DROP POLICY IF EXISTS "webhook_insert_leads" ON public.leads;
DROP POLICY IF EXISTS "auth_select_events" ON public.lead_events;
DROP POLICY IF EXISTS "auth_insert_events" ON public.lead_events;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.lead_events;

-- Leads table policies - authenticated users can do everything
CREATE POLICY "auth_select_leads" ON public.leads
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "auth_insert_leads" ON public.leads
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "auth_update_leads" ON public.leads
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Lead events policies - authenticated users can view and create
CREATE POLICY "auth_select_events" ON public.lead_events
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "auth_insert_events" ON public.lead_events
FOR INSERT TO authenticated
WITH CHECK (true);
