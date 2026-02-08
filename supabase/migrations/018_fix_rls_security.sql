-- ============================================
-- SECURITY FIX: Enable RLS on unprotected production tables
-- ============================================
-- Found by pentest (2026-02-07):
-- notifications, tasks, questionnaires, questionnaire_fields,
-- questionnaire_responses were accessible via anon key without RLS.
--
-- This migration enables RLS and creates policies matching
-- the existing pattern from 001_enable_rls_policies.sql:
-- authenticated users get full access, anon gets nothing.

-- ============================================
-- 1. NOTIFICATIONS
-- ============================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_notifications" ON public.notifications;
DROP POLICY IF EXISTS "auth_insert_notifications" ON public.notifications;
DROP POLICY IF EXISTS "auth_update_notifications" ON public.notifications;

CREATE POLICY "auth_select_notifications" ON public.notifications
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "auth_insert_notifications" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "auth_update_notifications" ON public.notifications
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 2. TASKS
-- ============================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_tasks" ON public.tasks;
DROP POLICY IF EXISTS "auth_insert_tasks" ON public.tasks;
DROP POLICY IF EXISTS "auth_update_tasks" ON public.tasks;

CREATE POLICY "auth_select_tasks" ON public.tasks
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "auth_insert_tasks" ON public.tasks
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "auth_update_tasks" ON public.tasks
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 3. QUESTIONNAIRES
-- ============================================

ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_questionnaires" ON public.questionnaires;
DROP POLICY IF EXISTS "auth_insert_questionnaires" ON public.questionnaires;
DROP POLICY IF EXISTS "auth_update_questionnaires" ON public.questionnaires;

CREATE POLICY "auth_select_questionnaires" ON public.questionnaires
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "auth_insert_questionnaires" ON public.questionnaires
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "auth_update_questionnaires" ON public.questionnaires
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 4. QUESTIONNAIRE_FIELDS
-- ============================================

ALTER TABLE public.questionnaire_fields ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_questionnaire_fields" ON public.questionnaire_fields;
DROP POLICY IF EXISTS "auth_insert_questionnaire_fields" ON public.questionnaire_fields;
DROP POLICY IF EXISTS "auth_update_questionnaire_fields" ON public.questionnaire_fields;

CREATE POLICY "auth_select_questionnaire_fields" ON public.questionnaire_fields
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "auth_insert_questionnaire_fields" ON public.questionnaire_fields
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "auth_update_questionnaire_fields" ON public.questionnaire_fields
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- 5. QUESTIONNAIRE_RESPONSES
-- ============================================

ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_questionnaire_responses" ON public.questionnaire_responses;
DROP POLICY IF EXISTS "auth_insert_questionnaire_responses" ON public.questionnaire_responses;
DROP POLICY IF EXISTS "auth_update_questionnaire_responses" ON public.questionnaire_responses;

CREATE POLICY "auth_select_questionnaire_responses" ON public.questionnaire_responses
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "auth_insert_questionnaire_responses" ON public.questionnaire_responses
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "auth_update_questionnaire_responses" ON public.questionnaire_responses
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- VERIFICATION: Check all tables have RLS enabled
-- ============================================
-- Run this after migration to verify:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
