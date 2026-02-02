-- ============================================
-- GENERIC QUESTIONNAIRE SYSTEM
-- ============================================
-- A flexible questionnaire system that can be used for any purpose:
-- - Business assessments
-- - Lead intake forms
-- - Customer feedback
-- - Any custom questionnaire
--
-- Design: Polymorphic target system - questionnaires can be attached to any entity

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- QUESTIONNAIRE DEFINITIONS
-- ============================================

-- Generic questionnaire templates
CREATE TABLE IF NOT EXISTS public.questionnaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  -- Flexible categorization
  category VARCHAR(50),                   -- e.g., 'business', 'lead', 'feedback', etc.
  tags JSONB DEFAULT '[]',                -- Additional tags for filtering
  -- Settings
  settings JSONB DEFAULT '{}',            -- Any custom settings (icon, color, etc.)
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

COMMENT ON TABLE public.questionnaires IS 'שאלונים - Generic questionnaire definitions';

-- Generic fields within questionnaires
CREATE TABLE IF NOT EXISTS public.questionnaire_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  -- Field type: text, number, boolean, select, multiselect, scale, date, etc.
  field_type VARCHAR(30) NOT NULL DEFAULT 'text',
  -- All field config in one flexible JSON
  config JSONB DEFAULT '{}',              -- options, min, max, placeholder, helper_text, etc.
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(questionnaire_id, slug)
);

COMMENT ON TABLE public.questionnaire_fields IS 'שדות בשאלון - Fields within a questionnaire';
COMMENT ON COLUMN public.questionnaire_fields.config IS 'Flexible config: {options: [], min: 0, max: 100, placeholder: "", helperText: "", ...}';

-- ============================================
-- QUESTIONNAIRE RESPONSES (Polymorphic)
-- ============================================

-- Generic responses - can be linked to any entity
CREATE TABLE IF NOT EXISTS public.questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id UUID NOT NULL REFERENCES questionnaires(id),
  -- Polymorphic target: what entity is this response about?
  target_type VARCHAR(50) NOT NULL,       -- 'lead', 'user', 'business', 'project', etc.
  target_id UUID NOT NULL,                -- ID of the target entity
  -- Who filled it
  respondent_id UUID,                     -- User who filled the questionnaire (optional)
  -- All answers in one flexible JSON
  answers JSONB NOT NULL DEFAULT '{}',    -- {field_slug: value, ...}
  -- Status
  status VARCHAR(30) DEFAULT 'draft',     -- draft, completed
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Soft delete
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.questionnaire_responses IS 'תשובות לשאלונים - Questionnaire responses linked to any entity';
COMMENT ON COLUMN public.questionnaire_responses.target_type IS 'Entity type: lead, user, business, etc.';
COMMENT ON COLUMN public.questionnaire_responses.answers IS 'Flexible answers: {field_slug: value, another_field: {text: "", selected: []}, ...}';

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_questionnaires_category ON questionnaires(category);
CREATE INDEX IF NOT EXISTS idx_questionnaires_active ON questionnaires(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_fields_questionnaire ON questionnaire_fields(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_fields_order ON questionnaire_fields(questionnaire_id, display_order);

CREATE INDEX IF NOT EXISTS idx_responses_questionnaire ON questionnaire_responses(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_responses_target ON questionnaire_responses(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_responses_respondent ON questionnaire_responses(respondent_id) WHERE respondent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_responses_status ON questionnaire_responses(status);

-- ============================================
-- DEV TABLES (for testing without RLS)
-- ============================================

CREATE TABLE IF NOT EXISTS public.dev_questionnaires (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  tags JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE TABLE IF NOT EXISTS public.dev_questionnaire_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id UUID NOT NULL REFERENCES dev_questionnaires(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  field_type VARCHAR(30) NOT NULL DEFAULT 'text',
  config JSONB DEFAULT '{}',
  is_required BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(questionnaire_id, slug)
);

CREATE TABLE IF NOT EXISTS public.dev_questionnaire_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  questionnaire_id UUID NOT NULL REFERENCES dev_questionnaires(id),
  target_type VARCHAR(50) NOT NULL,
  target_id UUID NOT NULL,
  respondent_id UUID,
  answers JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(30) DEFAULT 'draft',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Dev indexes
CREATE INDEX IF NOT EXISTS idx_dev_q_category ON dev_questionnaires(category);
CREATE INDEX IF NOT EXISTS idx_dev_fields_q ON dev_questionnaire_fields(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_dev_responses_target ON dev_questionnaire_responses(target_type, target_id);
