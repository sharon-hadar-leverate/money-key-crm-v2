-- ============================================
-- SEED DATA FOR QUESTIONNAIRE SYSTEM
-- ============================================
-- Sample questionnaires for:
-- 1. Business Assessment (6 pillars)
-- 2. Lead Questionnaires (intake, qualification, documents)

-- ============================================
-- BUSINESS ASSESSMENT QUESTIONNAIRES
-- ============================================

-- Finance Pillar
INSERT INTO public.questionnaires (slug, name, description, category, settings, display_order)
VALUES ('business-finance', 'פיננסים', 'הערכת המצב הפיננסי של העסק', 'business',
  '{"icon": "Wallet", "color": "#00854D", "pillar": "finance"}', 1)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.questionnaire_fields (questionnaire_id, slug, label, field_type, config, is_required, display_order)
SELECT q.id, f.slug, f.label, f.field_type, f.config::jsonb, f.is_required, f.display_order
FROM questionnaires q
CROSS JOIN (VALUES
  ('revenue_tracking', 'האם יש מעקב אחר הכנסות והוצאות?', 'boolean', '{}', true, 1),
  ('monthly_revenue', 'מהי ההכנסה החודשית הממוצעת?', 'number', '{"prefix": "₪", "placeholder": "0"}', false, 2),
  ('profit_margin', 'מהו אחוז הרווח הגולמי?', 'number', '{"suffix": "%", "min": 0, "max": 100}', false, 3),
  ('cash_flow_status', 'מה מצב תזרים המזומנים?', 'select', '{"options": [{"value": "positive", "label": "חיובי"}, {"value": "balanced", "label": "מאוזן"}, {"value": "negative", "label": "שלילי"}]}', true, 4),
  ('financial_goals', 'מהם היעדים הפיננסיים לשנה הקרובה?', 'text', '{"multiline": true, "placeholder": "תאר את היעדים..."}', false, 5)
) AS f(slug, label, field_type, config, is_required, display_order)
WHERE q.slug = 'business-finance'
ON CONFLICT (questionnaire_id, slug) DO NOTHING;

-- Operations Pillar
INSERT INTO public.questionnaires (slug, name, description, category, settings, display_order)
VALUES ('business-operations', 'תפעול', 'הערכת התפעול והתהליכים בעסק', 'business',
  '{"icon": "Settings", "color": "#0073EA", "pillar": "operations"}', 2)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.questionnaire_fields (questionnaire_id, slug, label, field_type, config, is_required, display_order)
SELECT q.id, f.slug, f.label, f.field_type, f.config::jsonb, f.is_required, f.display_order
FROM questionnaires q
CROSS JOIN (VALUES
  ('documented_processes', 'האם יש תהליכים מתועדים?', 'boolean', '{}', true, 1),
  ('team_size', 'כמה עובדים יש בעסק?', 'number', '{"min": 0}', true, 2),
  ('automation_level', 'מה רמת האוטומציה בעסק?', 'scale', '{"min": 1, "max": 5, "labels": ["ידני לחלוטין", "אוטומטי לחלוטין"]}', false, 3),
  ('main_challenges', 'מהם האתגרים התפעוליים העיקריים?', 'text', '{"multiline": true}', false, 4)
) AS f(slug, label, field_type, config, is_required, display_order)
WHERE q.slug = 'business-operations'
ON CONFLICT (questionnaire_id, slug) DO NOTHING;

-- Marketing Pillar
INSERT INTO public.questionnaires (slug, name, description, category, settings, display_order)
VALUES ('business-marketing', 'שיווק', 'הערכת אסטרטגיית השיווק', 'business',
  '{"icon": "Megaphone", "color": "#9D5BD2", "pillar": "marketing"}', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.questionnaire_fields (questionnaire_id, slug, label, field_type, config, is_required, display_order)
SELECT q.id, f.slug, f.label, f.field_type, f.config::jsonb, f.is_required, f.display_order
FROM questionnaires q
CROSS JOIN (VALUES
  ('marketing_channels', 'באילו ערוצי שיווק אתם משתמשים?', 'multiselect', '{"options": [{"value": "google", "label": "Google Ads"}, {"value": "facebook", "label": "Facebook/Instagram"}, {"value": "linkedin", "label": "LinkedIn"}, {"value": "organic", "label": "אורגני/SEO"}, {"value": "referrals", "label": "הפניות"}, {"value": "other", "label": "אחר"}]}', true, 1),
  ('monthly_budget', 'מה התקציב החודשי לשיווק?', 'number', '{"prefix": "₪"}', false, 2),
  ('brand_awareness', 'מה רמת המודעות למותג?', 'scale', '{"min": 1, "max": 5, "labels": ["נמוכה", "גבוהה"]}', false, 3),
  ('target_audience', 'מי קהל היעד שלכם?', 'text', '{"multiline": true}', true, 4)
) AS f(slug, label, field_type, config, is_required, display_order)
WHERE q.slug = 'business-marketing'
ON CONFLICT (questionnaire_id, slug) DO NOTHING;

-- Sales Pillar
INSERT INTO public.questionnaires (slug, name, description, category, settings, display_order)
VALUES ('business-sales', 'מכירות', 'הערכת תהליך המכירות', 'business',
  '{"icon": "TrendingUp", "color": "#D17A00", "pillar": "sales"}', 4)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.questionnaire_fields (questionnaire_id, slug, label, field_type, config, is_required, display_order)
SELECT q.id, f.slug, f.label, f.field_type, f.config::jsonb, f.is_required, f.display_order
FROM questionnaires q
CROSS JOIN (VALUES
  ('sales_process', 'האם יש תהליך מכירה מוגדר?', 'boolean', '{}', true, 1),
  ('conversion_rate', 'מה אחוז ההמרה הממוצע?', 'number', '{"suffix": "%", "min": 0, "max": 100}', false, 2),
  ('avg_deal_size', 'מה גודל העסקה הממוצע?', 'number', '{"prefix": "₪"}', false, 3),
  ('sales_cycle', 'כמה זמן לוקח לסגור עסקה?', 'select', '{"options": [{"value": "days", "label": "ימים"}, {"value": "weeks", "label": "שבועות"}, {"value": "months", "label": "חודשים"}]}', false, 4),
  ('crm_usage', 'האם משתמשים במערכת CRM?', 'boolean', '{}', true, 5)
) AS f(slug, label, field_type, config, is_required, display_order)
WHERE q.slug = 'business-sales'
ON CONFLICT (questionnaire_id, slug) DO NOTHING;

-- Technology Pillar
INSERT INTO public.questionnaires (slug, name, description, category, settings, display_order)
VALUES ('business-technology', 'טכנולוגיה', 'הערכת התשתית הטכנולוגית', 'business',
  '{"icon": "Laptop", "color": "#00A0B0", "pillar": "technology"}', 5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.questionnaire_fields (questionnaire_id, slug, label, field_type, config, is_required, display_order)
SELECT q.id, f.slug, f.label, f.field_type, f.config::jsonb, f.is_required, f.display_order
FROM questionnaires q
CROSS JOIN (VALUES
  ('has_website', 'האם יש אתר אינטרנט?', 'boolean', '{}', true, 1),
  ('tools_used', 'באילו כלים דיגיטליים אתם משתמשים?', 'text', '{"multiline": true, "placeholder": "CRM, אוטומציה, ניהול פרויקטים..."}', false, 2),
  ('tech_satisfaction', 'מה רמת שביעות הרצון מהכלים הקיימים?', 'scale', '{"min": 1, "max": 5, "labels": ["לא מרוצה", "מאוד מרוצה"]}', false, 3),
  ('tech_needs', 'מה חסר לכם מבחינה טכנולוגית?', 'text', '{"multiline": true}', false, 4)
) AS f(slug, label, field_type, config, is_required, display_order)
WHERE q.slug = 'business-technology'
ON CONFLICT (questionnaire_id, slug) DO NOTHING;

-- Strategy Pillar
INSERT INTO public.questionnaires (slug, name, description, category, settings, display_order)
VALUES ('business-strategy', 'אסטרטגיה', 'הערכת האסטרטגיה העסקית', 'business',
  '{"icon": "Target", "color": "#D83A52", "pillar": "strategy"}', 6)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.questionnaire_fields (questionnaire_id, slug, label, field_type, config, is_required, display_order)
SELECT q.id, f.slug, f.label, f.field_type, f.config::jsonb, f.is_required, f.display_order
FROM questionnaires q
CROSS JOIN (VALUES
  ('business_plan', 'האם יש תוכנית עסקית מעודכנת?', 'boolean', '{}', true, 1),
  ('vision', 'מה החזון לעסק ב-5 שנים הקרובות?', 'text', '{"multiline": true}', false, 2),
  ('competitive_advantage', 'מה היתרון התחרותי שלכם?', 'text', '{"multiline": true}', true, 3),
  ('growth_rate', 'מה קצב הצמיחה הרצוי?', 'select', '{"options": [{"value": "stable", "label": "שמירה על קיים"}, {"value": "moderate", "label": "צמיחה מתונה (10-20%)"}, {"value": "aggressive", "label": "צמיחה אגרסיבית (50%+)"}]}', false, 4)
) AS f(slug, label, field_type, config, is_required, display_order)
WHERE q.slug = 'business-strategy'
ON CONFLICT (questionnaire_id, slug) DO NOTHING;

-- ============================================
-- LEAD QUESTIONNAIRES
-- ============================================

-- Lead Intake Questionnaire
INSERT INTO public.questionnaires (slug, name, description, category, settings, display_order)
VALUES ('lead-intake', 'שאלון קליטה', 'שאלון ראשוני לקליטת ליד חדש', 'lead',
  '{"icon": "UserPlus", "color": "#00A0B0"}', 1)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.questionnaire_fields (questionnaire_id, slug, label, field_type, config, is_required, display_order)
SELECT q.id, f.slug, f.label, f.field_type, f.config::jsonb, f.is_required, f.display_order
FROM questionnaires q
CROSS JOIN (VALUES
  ('lead_source', 'מהו מקור הליד?', 'select', '{"options": [{"value": "google", "label": "Google"}, {"value": "facebook", "label": "Facebook"}, {"value": "referral", "label": "הפניה"}, {"value": "organic", "label": "אורגני"}, {"value": "other", "label": "אחר"}]}', true, 1),
  ('is_employed', 'האם הליד עובד כשכיר?', 'boolean', '{}', true, 2),
  ('years_employed', 'כמה שנים עובד במקום הנוכחי?', 'number', '{"min": 0, "max": 50}', false, 3),
  ('has_open_cases', 'האם יש תיקים פתוחים ברשות המסים?', 'boolean', '{}', true, 4),
  ('expected_refund', 'מה הצפי להחזר?', 'number', '{"prefix": "₪", "placeholder": "0"}', false, 5),
  ('ready_to_proceed', 'האם מוכן להתקדם?', 'boolean', '{}', true, 6),
  ('notes', 'הערות נוספות', 'text', '{"multiline": true}', false, 7)
) AS f(slug, label, field_type, config, is_required, display_order)
WHERE q.slug = 'lead-intake'
ON CONFLICT (questionnaire_id, slug) DO NOTHING;

-- Lead Qualification Questionnaire
INSERT INTO public.questionnaires (slug, name, description, category, settings, display_order)
VALUES ('lead-qualification', 'שאלון הסמכה', 'שאלון מפורט להסמכת הליד', 'lead',
  '{"icon": "ClipboardCheck", "color": "#00854D"}', 2)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.questionnaire_fields (questionnaire_id, slug, label, field_type, config, is_required, display_order)
SELECT q.id, f.slug, f.label, f.field_type, f.config::jsonb, f.is_required, f.display_order
FROM questionnaires q
CROSS JOIN (VALUES
  ('monthly_income', 'מהי ההכנסה החודשית הממוצעת?', 'number', '{"prefix": "₪"}', true, 1),
  ('num_employers', 'כמה מעסיקים היו בשנה האחרונה?', 'number', '{"min": 0, "max": 10}', true, 2),
  ('job_changes_mid_year', 'האם היו החלפות עבודה באמצע שנה?', 'boolean', '{}', true, 3),
  ('has_children', 'האם יש ילדים?', 'boolean', '{}', true, 4),
  ('num_children', 'כמה ילדים?', 'number', '{"min": 0, "max": 20}', false, 5),
  ('recognized_expenses', 'האם יש הוצאות מוכרות?', 'text', '{"multiline": true, "placeholder": "פרט הוצאות מוכרות..."}', false, 6),
  ('closing_probability', 'מהו סיכוי הסגירה?', 'scale', '{"min": 1, "max": 5, "labels": ["נמוך", "גבוה"]}', true, 7)
) AS f(slug, label, field_type, config, is_required, display_order)
WHERE q.slug = 'lead-qualification'
ON CONFLICT (questionnaire_id, slug) DO NOTHING;

-- Document Checklist
INSERT INTO public.questionnaires (slug, name, description, category, settings, display_order)
VALUES ('lead-documents', 'רשימת מסמכים', 'רשימת מסמכים נדרשים מהלקוח', 'lead',
  '{"icon": "FileCheck", "color": "#D17A00"}', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.questionnaire_fields (questionnaire_id, slug, label, field_type, config, is_required, display_order)
SELECT q.id, f.slug, f.label, f.field_type, f.config::jsonb, f.is_required, f.display_order
FROM questionnaires q
CROSS JOIN (VALUES
  ('id_card', 'תעודת זהות', 'boolean', '{"checkboxLabel": "התקבל"}', true, 1),
  ('form_106', 'טפסי 106', 'boolean', '{"checkboxLabel": "התקבל"}', true, 2),
  ('form_106_count', 'כמה טפסי 106?', 'number', '{"min": 0, "max": 10}', false, 3),
  ('salary_slips', 'תלושי משכורת', 'boolean', '{"checkboxLabel": "התקבל"}', true, 4),
  ('salary_slips_months', 'כמה חודשים?', 'number', '{"min": 0, "max": 12}', false, 5),
  ('bank_confirmation', 'אישור פרטי בנק', 'boolean', '{"checkboxLabel": "התקבל"}', true, 6),
  ('tax_credit_approval', 'אישור זכאות לנקודות זיכוי', 'boolean', '{"checkboxLabel": "התקבל"}', false, 7),
  ('additional_docs', 'מסמכים נוספים', 'text', '{"multiline": true, "placeholder": "פרט מסמכים נוספים שהתקבלו..."}', false, 8)
) AS f(slug, label, field_type, config, is_required, display_order)
WHERE q.slug = 'lead-documents'
ON CONFLICT (questionnaire_id, slug) DO NOTHING;

-- ============================================
-- COPY TO DEV TABLES
-- ============================================

INSERT INTO public.dev_questionnaires (id, slug, name, description, category, settings, display_order, created_at, updated_at)
SELECT id, slug, name, description, category, settings, display_order, created_at, updated_at
FROM public.questionnaires
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.dev_questionnaire_fields (id, questionnaire_id, slug, label, field_type, config, is_required, display_order, created_at)
SELECT f.id, f.questionnaire_id, f.slug, f.label, f.field_type, f.config, f.is_required, f.display_order, f.created_at
FROM public.questionnaire_fields f
JOIN public.dev_questionnaires dq ON dq.id = f.questionnaire_id
ON CONFLICT (questionnaire_id, slug) DO NOTHING;
