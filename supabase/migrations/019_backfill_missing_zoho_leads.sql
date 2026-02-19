-- Migration: 019_backfill_missing_zoho_leads.sql
-- Backfill leads missing from Zoho CRM migration (Leads + Contacts modules)
-- Source: Gap analysis comparing Zoho API data vs Supabase (2026-02-08)
--
-- 16 records from Zoho Leads module (not found in Supabase by phone)
-- 8 records from Zoho Contacts module (converted customers, never migrated)
-- Total: 24 records (after excluding invalid phones and test data)
--
-- Safety: Uses NOT EXISTS to skip any phone already in leads table
-- Dates: Real Zoho created_time for Leads module; Contacts dates unknown (defaults to NOW)

-- ============================================================
-- Zoho Leads module — 16 missing leads (with UTM/marketing data)
-- Dates from Zoho API created_time field
-- ============================================================

INSERT INTO leads (phone, first_name, last_name, name, email, status, source, utm_source, utm_campaign, utm_content, utm_term, created_at, updated_at)
SELECT v.phone, v.first_name, v.last_name, v.name, v.email, v.status, v.source,
       v.utm_source, v.utm_campaign, v.utm_content, v.utm_term, v.created_at, NOW()
FROM (VALUES
  -- 9 Meta Ads leads (Web Download / meta_ads)
  ('0525506034', 'אופק',              'קנפו',              'אופק קנפו',                'Tttttt218@gmail.com',      'no_answer',         'web',  'meta_ads', 'לידים באתר טל 26.5.25 - המרת דף תודה', 'סרטון שובל חור בקו״ח',  'Instagram_Reels',   '2025-08-01'::timestamptz),
  ('0538855838', 'שני',               'פרץ',               'שני פרץ',                  NULL,                       'message_sent',      'web',  'meta_ads', 'לידים באתר טל 26.5.25 - המרת דף תודה', 'סרטון שובל חור בקו״ח',  'Instagram_Feed',    '2025-08-02'::timestamptz),
  ('0502227289', 'שמעון חי',          'בוסקילה',           'שמעון חי בוסקילה',          'shimonnbuskila@gmail.com',  'pending_agreement', 'web',  'meta_ads', 'לידים באתר טל 26.5.25 - המרת דף תודה', 'סרטון שובל חור בקו״ח',  'Instagram_Feed',    '2025-08-02'::timestamptz),
  ('0527281494', 'Anastasia',         'Tourchinsky',       'Anastasia Tourchinsky',     'anastour@gmail.com',       'not_relevant',      'web',  'meta_ads', 'לידים באתר טל 26.5.25 - המרת דף תודה', 'סרטון שובל חור בקו״ח',  'Instagram_Reels',   '2025-08-02'::timestamptz),
  ('0524269264', 'שרון',              'אורדונז',           'שרון אורדונז',              NULL,                       'not_relevant',      'web',  'meta_ads', 'לידים באתר טל 26.5.25 - המרת דף תודה', 'סרטון שובל חור בקו״ח',  'Instagram_Reels',   '2025-08-04'::timestamptz),
  ('0549700735', 'יאנה מעיין חיה',    'ריכנשטיין',         'יאנה מעיין חיה ריכנשטיין',  'yanaray4554@gmail.com',    'pending_agreement', 'web',  'meta_ads', 'לידים באתר טל 26.5.25 - המרת דף תודה', 'סרטון שובל חור בקו״ח',  'Instagram_Feed',    '2025-08-04'::timestamptz),
  ('0508654848', 'מור',               'אברג''יל',          'מור אברג''יל',              'abargilmor10@gmail.com',   'message_sent',      'web',  'meta_ads', 'לידים באתר טל 26.5.25 - המרת דף תודה', 'סרטון שובל חור בקו״ח',  'Instagram_Explore', '2025-08-05'::timestamptz),
  ('0542883093', 'ליזה',              'בוחובסקי',          'ליזה בוחובסקי',             'lizablumental@gmail.com',  'no_answer',         'web',  'meta_ads', 'לידים באתר טל 26.5.25 - המרת דף תודה', 'סרטון שובל 30K',        'Instagram_Feed',    '2025-08-07'::timestamptz),
  ('0502988817', 'גמיל',              'אבו סיני',          'גמיל אבו סיני',             'jone_win@hotmail.com',     'message_sent',      'web',  'meta_ads', 'לידים באתר טל 26.5.25 - המרת דף תודה', 'סרטון שובל חור בקו״ח',  'Instagram_Feed',    '2025-10-02'::timestamptz),
  -- 3 Facebook leads (FB - / no UTM details)
  ('0528249515', NULL,                'יהודית זקן',        'יהודית זקן',                NULL,                       'not_relevant',      NULL,   'facebook', NULL,                                    NULL,                     NULL,                '2025-11-23'::timestamptz),
  ('0546293858', NULL,                'שמעון אליטים',      'שמעון אליטים',              NULL,                       'pending_agreement', NULL,   'facebook', NULL,                                    NULL,                     NULL,                '2025-11-23'::timestamptz),
  ('0549171751', 'Wesam',             'Alseed',            'Wesam Alseed',              NULL,                       'not_contacted',     NULL,   'facebook', NULL,                                    NULL,                     NULL,                '2025-11-23'::timestamptz),
  -- 1 organic lead (no UTM)
  ('0537778120', 'גיא',               'כהן',               'גיא כהן',                   NULL,                       'future_interest',   NULL,   NULL,       NULL,                                    NULL,                     NULL,                '2026-01-02'::timestamptz),
  -- 2 Google Ads leads
  ('0547076495', 'ממו',               'רטה',               'ממו רטה',                   NULL,                       'future_interest',   NULL,   'google_ads', '23156643112',                         '779772255795',           NULL,                '2026-01-06'::timestamptz),
  ('0508900576', 'טלי',               'ברנשטיין',          'טלי ברנשטיין',              NULL,                       'meeting_set',       NULL,   'google_ads', '23156643112',                         '779772255795',           NULL,                '2026-01-09'::timestamptz),
  -- 1 organic lead (no UTM)
  ('0523064637', 'יואב',              'חדד',               'יואב חדד',                  NULL,                       'future_interest',   NULL,   NULL,       NULL,                                    NULL,                     NULL,                '2026-01-26'::timestamptz)
) AS v(phone, first_name, last_name, name, email, status, source, utm_source, utm_campaign, utm_content, utm_term, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM leads l WHERE l.phone = v.phone AND l.deleted_at IS NULL
);

-- ============================================================
-- Zoho Contacts module — 8 converted customers (never migrated)
-- UTM data recovered from "כל הלידים" CSV for 3 converted leads
-- Remaining 5 were added directly to Contacts (no lead history)
-- Dates from Zoho Contacts CSV export (לקוחות_2026_02_08.csv)
-- ============================================================

INSERT INTO leads (phone, first_name, last_name, name, email, status, source, utm_source, utm_campaign, utm_content, utm_term, refund_amount, commission_rate, created_at, updated_at)
SELECT v.phone, v.first_name, v.last_name, v.name, v.email, v.status, v.source,
       v.utm_source, v.utm_campaign, v.utm_content, v.utm_term, v.refund_amount, v.commission_rate, v.created_at, NOW()
FROM (VALUES
  -- 2 converted leads with full Meta Ads UTM data
  ('0502763381', 'אעה',     'הואשלה',     'אעה הואשלה',      'ajajsaleh238@gmail.com',  'payment_completed', 'web',           'meta_ads', 'לידים באתר טל 26.5.25 - המרת דף תודה', 'סרטון שובל סיכוי גבוה שמחכה לכם', 'Instagram_Explore', NULL::numeric, NULL::numeric, '2025-06-02'::timestamptz),
  ('0523908987', 'משי',     'אברהמי',     'משי אברהמי',      'meshiavrahami@gmail.com', 'payment_completed', 'web',           'meta_ads', 'לידים באתר טל 26.5.25 - המרת דף תודה', 'סרטון שובל חור בקו״ח',             'Instagram_Feed',    64153, 15,             '2025-06-11'::timestamptz),
  -- 1 converted lead from WhatsApp (no UTM campaign details)
  ('0545879505', 'Alon',    'Fiterman',   'Alon Fiterman',   NULL,                      'payment_completed', 'whatsapp',      'whatsapp', NULL,                                    NULL,                                NULL,                14767, 15,             '2025-06-12'::timestamptz),
  -- 5 added directly to Contacts module (no lead history found)
  ('0546738575', 'מעיין',   'רוזנברג',    'מעיין רוזנברג',   NULL,                      'payment_completed', 'zoho_contacts', NULL,       NULL,                                    NULL,                                NULL,                NULL, NULL,           '2024-11-30'::timestamptz),
  ('0506522576', 'הגר',     'יד שלום',    'הגר יד שלום',     NULL,                      'payment_completed', 'zoho_contacts', NULL,       NULL,                                    NULL,                                NULL,                NULL, NULL,           '2024-11-30'::timestamptz),
  ('0523452553', 'אביב',    'פדידה',      'אביב פדידה',      NULL,                      'payment_completed', 'zoho_contacts', NULL,       NULL,                                    NULL,                                NULL,                1273, 15,             '2024-11-30'::timestamptz),
  ('0522057245', 'שי',      'פורת',       'שי פורת',         NULL,                      'payment_completed', 'zoho_contacts', NULL,       NULL,                                    NULL,                                NULL,                NULL, NULL,           '2025-06-03'::timestamptz),
  ('0505547377', 'נועם',    'ארכיטקטר',   'נועם ארכיטקטר',   NULL,                      'payment_completed', 'zoho_contacts', NULL,       NULL,                                    NULL,                                NULL,                NULL, NULL,           '2025-07-23'::timestamptz)
) AS v(phone, first_name, last_name, name, email, status, source, utm_source, utm_campaign, utm_content, utm_term, refund_amount, commission_rate, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM leads l WHERE l.phone = v.phone AND l.deleted_at IS NULL
);
