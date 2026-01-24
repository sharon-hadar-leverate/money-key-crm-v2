-- Migration: Create dev versions of notes tables for BYPASS_AUTH mode testing
-- These tables have no RLS for easier development

-- Create dev_user_profiles table (copy structure from user_profiles)
CREATE TABLE IF NOT EXISTS public.dev_user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS on dev table
ALTER TABLE public.dev_user_profiles DISABLE ROW LEVEL SECURITY;

-- Grant access to both anon and authenticated
GRANT SELECT, INSERT, UPDATE ON public.dev_user_profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.dev_user_profiles TO authenticated;

-- Create dev_lead_notes table (copy structure from lead_notes)
CREATE TABLE IF NOT EXISTS public.dev_lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL,  -- No FK constraint for flexibility in dev
  content TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- Disable RLS on dev table
ALTER TABLE public.dev_lead_notes DISABLE ROW LEVEL SECURITY;

-- Grant access to both anon and authenticated
GRANT SELECT, INSERT, UPDATE ON public.dev_lead_notes TO anon;
GRANT SELECT, INSERT, UPDATE ON public.dev_lead_notes TO authenticated;

-- Add indexes for dev tables
CREATE INDEX IF NOT EXISTS idx_dev_user_profiles_user_id ON public.dev_user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_dev_lead_notes_lead_id ON public.dev_lead_notes(lead_id);
CREATE INDEX IF NOT EXISTS idx_dev_lead_notes_user_id ON public.dev_lead_notes(user_id);

-- Insert a default dev user for testing
INSERT INTO public.dev_user_profiles (user_id, email, display_name)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'dev@example.com',
  'משתמש פיתוח'
) ON CONFLICT (user_id) DO NOTHING;
