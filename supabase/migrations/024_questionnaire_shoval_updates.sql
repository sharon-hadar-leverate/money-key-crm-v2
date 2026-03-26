-- ============================================
-- QUESTIONNAIRE SHOVAL UPDATES
-- ============================================
-- 1. All number fields → text (free input, no constraints)
-- 2. income_tax_deducted: boolean → text
-- 3. Add detailField config to all boolean + select fields
-- 4. New question: האם עשית מילואים
-- 5. All fields → not required
-- 6. Copy changes to dev tables

-- ============================================
-- STEP 1: Convert number fields to text
-- ============================================

-- age: number → text
UPDATE public.questionnaire_fields
SET field_type = 'text', config = '{"placeholder": "גיל"}'::jsonb
WHERE slug = 'age'
  AND questionnaire_id = (SELECT id FROM public.questionnaires WHERE slug = 'lead-client');

-- average_salary: number → text (needs to support dual-spouse info)
UPDATE public.questionnaire_fields
SET field_type = 'text', config = '{"placeholder": "לדוגמה: שכר בעל 8,000 ₪, שכר אישה 12,000 ₪"}'::jsonb
WHERE slug = 'average_salary'
  AND questionnaire_id = (SELECT id FROM public.questionnaires WHERE slug = 'lead-client');

-- children_count: number → text
UPDATE public.questionnaire_fields
SET field_type = 'text', config = '{"placeholder": "מספר ילדים"}'::jsonb
WHERE slug = 'children_count'
  AND questionnaire_id = (SELECT id FROM public.questionnaires WHERE slug = 'lead-client');

-- donation_amount: number → text
UPDATE public.questionnaire_fields
SET field_type = 'text', config = '{"placeholder": "סכום התרומה"}'::jsonb
WHERE slug = 'donation_amount'
  AND questionnaire_id = (SELECT id FROM public.questionnaires WHERE slug = 'lead-client');

-- ============================================
-- STEP 2: Convert income_tax_deducted from boolean to text
-- ============================================

UPDATE public.questionnaire_fields
SET field_type = 'text', config = '{"placeholder": "לדוגמה: כן לבעל, לא לאישה"}'::jsonb
WHERE slug = 'income_tax_deducted'
  AND questionnaire_id = (SELECT id FROM public.questionnaires WHERE slug = 'lead-client');

-- ============================================
-- STEP 3: Add detailField to all remaining boolean fields
-- ============================================

UPDATE public.questionnaire_fields
SET config = config || '{"detailField": {"placeholder": "פירוט..."}}'::jsonb
WHERE field_type = 'boolean'
  AND questionnaire_id = (SELECT id FROM public.questionnaires WHERE slug = 'lead-client');

-- ============================================
-- STEP 4: Add detailField to select fields (marital_status, employment_type)
-- ============================================

UPDATE public.questionnaire_fields
SET config = config || '{"detailField": {"placeholder": "פירוט..."}}'::jsonb
WHERE slug = 'marital_status'
  AND questionnaire_id = (SELECT id FROM public.questionnaires WHERE slug = 'lead-client');

UPDATE public.questionnaire_fields
SET config = config || '{"detailField": {"placeholder": "פירוט לפי שנים..."}}'::jsonb
WHERE slug = 'employment_type'
  AND questionnaire_id = (SELECT id FROM public.questionnaires WHERE slug = 'lead-client');

-- ============================================
-- STEP 5: Add new question - האם עשית מילואים
-- ============================================

-- Shift display_order for fields at position 23+ to make room
UPDATE public.questionnaire_fields
SET display_order = display_order + 1
WHERE display_order >= 23
  AND questionnaire_id = (SELECT id FROM public.questionnaires WHERE slug = 'lead-client');

-- Insert the new field
INSERT INTO public.questionnaire_fields (questionnaire_id, slug, label, field_type, config, is_required, display_order)
SELECT q.id, 'military_reserve_service', 'האם עשית מילואים?', 'boolean',
  '{"detailField": {"placeholder": "פירוט..."}}'::jsonb, false, 23
FROM public.questionnaires q
WHERE q.slug = 'lead-client'
ON CONFLICT (questionnaire_id, slug) DO NOTHING;

-- ============================================
-- STEP 6: Set ALL fields to not required
-- ============================================

UPDATE public.questionnaire_fields
SET is_required = false
WHERE questionnaire_id = (SELECT id FROM public.questionnaires WHERE slug = 'lead-client');

-- ============================================
-- STEP 7: Sync all changes to dev tables
-- ============================================

-- Delete existing dev fields for lead-client and re-copy
DELETE FROM public.dev_questionnaire_fields
WHERE questionnaire_id = (SELECT id FROM public.dev_questionnaires WHERE slug = 'lead-client');

INSERT INTO public.dev_questionnaire_fields (id, questionnaire_id, slug, label, field_type, config, is_required, display_order, created_at)
SELECT f.id, f.questionnaire_id, f.slug, f.label, f.field_type, f.config, f.is_required, f.display_order, f.created_at
FROM public.questionnaire_fields f
JOIN public.questionnaires q ON q.id = f.questionnaire_id
WHERE q.slug = 'lead-client';
