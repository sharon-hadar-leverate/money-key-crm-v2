-- ============================================
-- ADD NEW "שאלון לקוח" LEAD QUESTIONNAIRE
-- ============================================
-- Archives old lead questionnaires (lead-intake, lead-qualification, lead-documents)
-- and replaces them with a single comprehensive questionnaire.
-- Existing responses are preserved (is_active = false keeps data intact).

-- ============================================
-- STEP 1: Archive old lead questionnaires
-- ============================================

UPDATE public.questionnaires SET is_active = false
WHERE slug IN ('lead-intake', 'lead-qualification', 'lead-documents');

UPDATE public.dev_questionnaires SET is_active = false
WHERE slug IN ('lead-intake', 'lead-qualification', 'lead-documents');

-- ============================================
-- STEP 2: Insert new questionnaire
-- ============================================

INSERT INTO public.questionnaires (slug, name, description, category, settings, display_order)
VALUES ('lead-client', 'שאלון לקוח', 'שאלון מקיף ללקוח - דמוגרפיה, תעסוקה, אירועי מס ומצב פיננסי (2020-2025)', 'lead',
  '{"icon": "ClipboardList", "color": "#0073EA"}', 1)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- STEP 3: Insert questionnaire fields
-- ============================================

INSERT INTO public.questionnaire_fields (questionnaire_id, slug, label, field_type, config, is_required, display_order)
SELECT q.id, f.slug, f.label, f.field_type, f.config::jsonb, f.is_required, f.display_order
FROM questionnaires q
CROSS JOIN (VALUES
  -- Demographics
  ('age', 'בת/בן כמה את/ה?', 'number', '{"min": 0, "max": 120}', true, 1),
  ('marital_status', 'מצב משפחתי?', 'select', '{"options": [{"value": "single", "label": "רווק/ה"}, {"value": "married", "label": "נשוי/אה"}, {"value": "divorced", "label": "גרוש/ה"}, {"value": "widowed", "label": "אלמן/ה"}]}', true, 2),
  ('marital_status_since', 'מאיזו שנה? (נישואים/גירושים)', 'date', '{}', false, 3),
  ('has_children', 'האם יש ילדים?', 'boolean', '{}', true, 4),
  ('children_count', 'כמה ילדים?', 'number', '{"min": 0, "max": 20}', false, 5),
  ('children_ages', 'גילאי הילדים', 'text', '{"placeholder": "לדוגמה: 3, 7, 12"}', false, 6),
  ('address_last_6_years', 'איפה גרת ב-6 שנים האחרונות?', 'text', '{"placeholder": "עיר / יישוב"}', true, 7),

  -- Employment
  ('employment_type', 'את/ה שכיר/ה או עצמאי/ת? (2020-2025)', 'select', '{"options": [{"value": "employee", "label": "שכיר/ה"}, {"value": "self_employed", "label": "עצמאי/ת"}, {"value": "both", "label": "שניהם"}]}', true, 8),
  ('average_salary', 'מה השכר הממוצע שלך?', 'number', '{"prefix": "₪", "placeholder": "0"}', true, 9),
  ('income_tax_deducted', 'יורד לך מס הכנסה מהתלוש?', 'boolean', '{}', true, 10),
  ('worked_in_government', 'עבדת במשרדי ממשלה?', 'boolean', '{}', true, 11),
  ('stock_market_investor', 'משקיע/ה בשוק ההון?', 'boolean', '{}', true, 12),

  -- Tax events
  ('sold_property_with_tax', 'מכרת דירה או נכס ושילמת מס שבח ב-6 שנים האחרונות?', 'boolean', '{}', true, 13),
  ('pension_withdrawal_taxed', 'הייתה לך משיכה של פנסיה/קופת גמל ונוכה לך על זה מס?', 'boolean', '{}', true, 14),
  ('changed_jobs', 'החלפת מקומות עבודה ב-6 שנים האחרונות?', 'boolean', '{}', true, 15),
  ('gap_between_jobs', 'האם הייתה תקופה בין עבודות?', 'boolean', '{}', false, 16),
  ('received_unemployment', 'קיבלת דמי אבטלה?', 'boolean', '{}', false, 17),
  ('had_unpaid_leave_or_maternity', 'היית בחל"ת / חופשת לידה ב-6 שנים האחרונות?', 'boolean', '{}', true, 18),
  ('unpaid_leave_duration', 'כמה זמן? (חל"ת/חופשת לידה)', 'text', '{"placeholder": "לדוגמה: 3 חודשים"}', false, 19),
  ('children_regular_education', 'הילדים בחינוך רגיל?', 'boolean', '{}', false, 20),

  -- Status & credits
  ('new_immigrant', 'עולה חדש/ה?', 'boolean', '{}', true, 21),
  ('discharged_from_idf', 'השתחררת מצה"ל ב-6 שנים האחרונות?', 'boolean', '{}', true, 22),
  ('donated_to_charity', 'תרמת לעמותה / מוסד ציבורי / ישיבה באופן קבוע?', 'boolean', '{}', true, 23),
  ('donation_amount', 'מה סכום התרומה?', 'number', '{"prefix": "₪", "placeholder": "0"}', false, 24),
  ('bank_account_clear', 'חשבון בנק תקין? בלי עיקולים / פשיטת רגל וכו?', 'boolean', '{}', true, 25),
  ('family_disability', 'מישהו מבני הבית עם אחוזי נכות חלילה?', 'boolean', '{}', true, 26),

  -- Financial history
  ('previous_tax_refunds', 'עשית החזרי מס בשנים האלו?', 'boolean', '{}', true, 27),
  ('active_mortgage', 'משכנתא פעילה?', 'boolean', '{}', true, 28),
  ('private_life_insurance', 'ביטוחי חיים באופן פרטני (לא דרך העבודה)?', 'boolean', '{}', true, 29),
  ('academic_studies_recent', 'לימודים אקדמאיים סיימת ב-8 שנים האחרונות?', 'boolean', '{}', true, 30),
  ('additional_income', 'הכנסות נוספות? (מזונות, שכ"ד וכו'')', 'boolean', '{}', true, 31),
  ('income_from_abroad', 'הכנסות מחו"ל?', 'boolean', '{}', true, 32),
  ('has_crypto', 'האם יש לך מטבעות דיגיטליים?', 'boolean', '{}', true, 33),
  ('pays_alimony', 'במידה וגרוש/ה – האם משלם/ת מזונות?', 'boolean', '{}', false, 34)
) AS f(slug, label, field_type, config, is_required, display_order)
WHERE q.slug = 'lead-client'
ON CONFLICT (questionnaire_id, slug) DO NOTHING;

-- ============================================
-- STEP 4: Copy to dev tables
-- ============================================

-- Copy questionnaire (update is_active for archived ones too)
INSERT INTO public.dev_questionnaires (id, slug, name, description, category, settings, display_order, is_active, created_at, updated_at)
SELECT id, slug, name, description, category, settings, display_order, is_active, created_at, updated_at
FROM public.questionnaires
WHERE slug IN ('lead-client', 'lead-intake', 'lead-qualification', 'lead-documents')
ON CONFLICT (slug) DO UPDATE SET is_active = EXCLUDED.is_active;

-- Copy fields for the new questionnaire
INSERT INTO public.dev_questionnaire_fields (id, questionnaire_id, slug, label, field_type, config, is_required, display_order, created_at)
SELECT f.id, f.questionnaire_id, f.slug, f.label, f.field_type, f.config, f.is_required, f.display_order, f.created_at
FROM public.questionnaire_fields f
JOIN public.questionnaires q ON q.id = f.questionnaire_id
WHERE q.slug = 'lead-client'
ON CONFLICT (questionnaire_id, slug) DO NOTHING;
