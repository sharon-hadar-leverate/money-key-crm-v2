-- Migration: 020_update_paying_customer_income.sql
-- Comprehensive update: paying customers status, income data, and missing customer inserts
-- Source: Accounting invoices + monthly income reports cross-referenced with Supabase
--
-- A: 11 existing leads — set status to payment_completed + add refund_amount/commission_rate
-- B: 3 existing leads — set status to payment_completed only (already have refund_amount)
-- C: 3 existing leads — fix name/phone + set status (found via cross-reference)
-- D: 26 new paying customers — INSERT (not found in Supabase)

-- ============================================================
-- A: Update status + add income (11 leads)
-- ============================================================

-- חיים צרפתי — income 630, refund 4200
UPDATE leads SET
  status = 'payment_completed',
  refund_amount = 4200,
  commission_rate = 15,
  updated_at = NOW()
WHERE phone = '0538877093' AND deleted_at IS NULL;

-- דריה (אנדרייב) — income 571, refund 3807
UPDATE leads SET
  status = 'payment_completed',
  refund_amount = 3807,
  commission_rate = 15,
  updated_at = NOW()
WHERE phone = '0502328927' AND deleted_at IS NULL;

-- יונתן לימור ליפשיץ — income 196, refund 1307
UPDATE leads SET
  status = 'payment_completed',
  refund_amount = 1307,
  commission_rate = 15,
  updated_at = NOW()
WHERE phone = '0544242477' AND deleted_at IS NULL;

-- לין ניסן — income 630, refund 4200
UPDATE leads SET
  status = 'payment_completed',
  refund_amount = 4200,
  commission_rate = 15,
  updated_at = NOW()
WHERE phone = '0506615043' AND deleted_at IS NULL;

-- שרונה סומך — income 600, refund 4995 (discounted)
UPDATE leads SET
  status = 'payment_completed',
  refund_amount = 4995,
  commission_rate = 12.01,
  updated_at = NOW()
WHERE phone = '0526998679' AND deleted_at IS NULL;

-- דיקלה אסייג — income 4700, refund 34269 (discounted)
UPDATE leads SET
  status = 'payment_completed',
  refund_amount = 34269,
  commission_rate = 13.71,
  updated_at = NOW()
WHERE phone = '0532423182' AND deleted_at IS NULL;

-- בורהאן גרבאו — income 1425, refund 9500
UPDATE leads SET
  status = 'payment_completed',
  refund_amount = 9500,
  commission_rate = 15,
  updated_at = NOW()
WHERE phone = '0528428536' AND deleted_at IS NULL;

-- יקיר לוסקי — income 175, refund 1167
UPDATE leads SET
  status = 'payment_completed',
  refund_amount = 1167,
  commission_rate = 15,
  updated_at = NOW()
WHERE phone = '0533232909' AND deleted_at IS NULL;

-- משה ללוש ללוש — income 840, refund 5683 (discounted)
UPDATE leads SET
  status = 'payment_completed',
  refund_amount = 5683,
  commission_rate = 14.78,
  updated_at = NOW()
WHERE phone = '0507828861' AND deleted_at IS NULL;

-- חגית ארמה — income 2375, refund 16813 (discounted)
UPDATE leads SET
  status = 'payment_completed',
  refund_amount = 16813,
  commission_rate = 14.13,
  updated_at = NOW()
WHERE phone = '0548074213' AND deleted_at IS NULL;

-- liah קניג — already payment_completed, just add income 641, refund 4273
UPDATE leads SET
  refund_amount = 4273,
  commission_rate = 15,
  updated_at = NOW()
WHERE phone = '0535305100' AND deleted_at IS NULL;

-- ============================================================
-- B: Update status only (3 leads that already have refund_amount)
-- ============================================================

-- תום סלטו — corrected refund from 73000 to 73134
UPDATE leads SET
  status = 'payment_completed',
  refund_amount = 73134,
  updated_at = NOW()
WHERE phone = '0545490713' AND deleted_at IS NULL;

-- מרגריטה לפנוב — existing refund 4083, commission 15
UPDATE leads SET
  status = 'payment_completed',
  updated_at = NOW()
WHERE phone = '0545227696' AND deleted_at IS NULL;

-- שגיא לקריף — existing refund 3800, commission 16
UPDATE leads SET
  status = 'payment_completed',
  updated_at = NOW()
WHERE phone = '0533335953' AND deleted_at IS NULL;

-- ============================================================
-- C: Fix name/phone for 3 existing leads found via cross-reference
-- ============================================================

-- טל בו → טל וגיל בן דוד (same phone, name correction + status)
UPDATE leads SET
  first_name = 'טל וגיל',
  last_name = 'בן דוד',
  name = 'טל וגיל בן דוד',
  status = 'payment_completed',
  updated_at = NOW()
WHERE phone = '0542431031' AND deleted_at IS NULL;

-- Angel Romano Keinan → אנגל רומנו קינן (fix phone prefix + Hebrew name + status)
UPDATE leads SET
  phone = '0527320833',
  first_name = 'אנגל רומנו',
  last_name = 'קינן',
  name = 'אנגל רומנו קינן',
  status = 'payment_completed',
  updated_at = NOW()
WHERE phone = '+0527320833' AND deleted_at IS NULL;

-- מרגריטה (0522585538) → רותם טרנטו (different person name + new phone + status)
UPDATE leads SET
  phone = '0506278269',
  first_name = 'רותם',
  last_name = 'טרנטו',
  name = 'רותם טרנטו',
  status = 'payment_completed',
  updated_at = NOW()
WHERE phone = '0522585538' AND deleted_at IS NULL;

-- ============================================================
-- D: Insert 26 new paying customers (not found in Supabase)
-- ============================================================

INSERT INTO leads (phone, first_name, last_name, name, status, source, refund_amount, commission_rate, created_at, updated_at)
SELECT v.phone, v.first_name, v.last_name, v.name, v.status, v.source,
       v.refund_amount, v.commission_rate, v.created_at, NOW()
FROM (VALUES
  -- From accounting invoices (have income data + invoice dates)
  ('0508464462',   'יאיר',           'נוימן',      'יאיר נוימן',             'payment_completed', NULL::text,  3767::numeric,   15::numeric, '2026-02-01'::timestamptz),
  ('+19178558173', 'עומר',           'שר',         'עומר שר',                'payment_completed', NULL,        101233,          15,          '2026-01-19'::timestamptz),
  ('0524602712',   'דניאל',          'דרלי',       'דניאל דרלי',             'payment_completed', 'הפניה',     4433,            15,          '2025-12-03'::timestamptz),
  ('0547571230',   'סימון וקסניה',   'דרוקמן',     'סימון וקסניה דרוקמן',    'payment_completed', NULL,        4693,            15,          '2025-11-18'::timestamptz),
  ('0522759448',   'נועם',           'אהרונסון',   'נועם אהרונסון',          'payment_completed', NULL,        33420,           15,          '2025-11-17'::timestamptz),
  ('0526791804',   'גיא',            'שם טוב',     'גיא שם טוב',            'payment_completed', NULL,        3707,            15,          '2025-11-12'::timestamptz),
  ('0545487018',   'גיל',            'טיילור',     'גיל טיילור',             'payment_completed', NULL,        15513,           15,          '2025-04-01'::timestamptz),
  ('0509737050',   'ירדן',           'קאירי',      'ירדן קאירי',             'payment_completed', NULL,        8333,            15,          '2025-04-01'::timestamptz),
  ('0544736408',   'אביהו ג''ורג',   'כהן',        'אביהו ג''ורג כהן',       'payment_completed', NULL,        7487,            15,          '2025-09-15'::timestamptz),
  ('0504871306',   'אלון',           'שמורק',      'אלון שמורק',             'payment_completed', NULL,        5407,            15,          '2025-09-10'::timestamptz),
  ('0584212143',   'אסף',            'מתתיהו',     'אסף מתתיהו',             'payment_completed', NULL,        2447,            15,          '2025-08-28'::timestamptz),
  ('0546565166',   'שלי',            'סבירסקי',    'שלי סבירסקי',            'payment_completed', NULL,        3647,            15,          '2025-08-22'::timestamptz),
  ('0528822221',   'נהר',            'זמורה',      'נהר/נוהר זמורה',         'payment_completed', NULL,        35893,           15,          '2025-05-30'::timestamptz),
  ('0544938196',   'איתי',           'טסה',        'איתי טסה',               'payment_completed', NULL,        2787,            15,          '2025-05-29'::timestamptz),
  ('0515060855',   'עדן',            'מגר-מני',    'עדן מגר-מני',            'payment_completed', NULL,        6640,            15,          '2025-05-20'::timestamptz),
  ('0546307835',   'עמי',            'ויסוסקי',    'עמי ויסוסקי',            'payment_completed', NULL,        4713,            15,          '2025-04-27'::timestamptz),
  ('0549444234',   'שמעון',          'אלמקיאס',    'אלמקיאס שמעון',          'payment_completed', NULL,        6333,            15,          '2025-04-27'::timestamptz),
  ('0547806784',   'פרדי ולירון',    'לוין',       'פרדי ולירון לוין',        'payment_completed', NULL,        164473,          15,          '2025-04-01'::timestamptz),
  ('0549167577',   'אוהד ורינת',    'יפת',        'יפת אוהד ורינת',         'payment_completed', NULL,        4860,            15,          '2025-08-19'::timestamptz),
  ('0524614333',   'מיכאל',          'בן סימון',   'מיכאל בן סימון',         'payment_completed', NULL,        6760,            15,          '2025-05-13'::timestamptz),
  -- From monthly income reports (have source info, 1st of month)
  ('0546105814',   'יהונתן',         'עכו',        'יהונתן עכו',             'payment_completed', 'הפניה',     900,             15,          '2025-11-01'::timestamptz),
  ('0528089818',   'יובל',           'ספרוני',     'יובל ספרוני',            'payment_completed', 'הפניה',     667,             15,          '2025-12-01'::timestamptz),
  -- Word-of-mouth leads (פה לאוזן, reported by Lilach)
  ('0526388257',   'טיגאבו',         'צ׳קול',      'טיגאבו צ׳קול',           'payment_completed', 'הפניה',     3460,            15,          '2026-01-01'::timestamptz),
  ('0544839945',   'קטיה ואמיר',     'איתן',       'קטיה ואמיר איתן',        'payment_completed', 'הפניה',     NULL,            NULL,        '2026-01-01'::timestamptz),
  ('0547257015',   'עדי ורועי',      'דנה',        'עדי ורועי דנה',          'payment_completed', 'הפניה',     NULL,            NULL,        '2025-04-01'::timestamptz),
  -- No financial data
  ('0549837877',   'שובל',           'חלף',        'שובל חלף',               'payment_completed', NULL,        NULL,            NULL,        '2025-04-01'::timestamptz)
) AS v(phone, first_name, last_name, name, status, source, refund_amount, commission_rate, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM leads l WHERE l.phone = v.phone AND l.deleted_at IS NULL
);

