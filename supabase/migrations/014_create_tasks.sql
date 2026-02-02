-- ============================================
-- MANUAL TASKS SYSTEM
-- ============================================
-- Stores manual tasks that can be assigned to users
-- and optionally linked to leads

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TASKS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- Assignment
  created_by UUID NOT NULL,                 -- Who created it
  assigned_to UUID,                         -- Who should do it (null = unassigned)

  -- Related entity (optional)
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Status & Priority
  status VARCHAR(30) DEFAULT 'pending',     -- pending, in_progress, completed, cancelled
  priority VARCHAR(20) DEFAULT 'normal',    -- low, normal, high, urgent

  -- Dates
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE public.tasks IS 'משימות - Manual tasks for the CRM';
COMMENT ON COLUMN public.tasks.status IS 'Task status: pending, in_progress, completed, cancelled';
COMMENT ON COLUMN public.tasks.priority IS 'Task priority: low, normal, high, urgent';

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_lead ON tasks(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE status = 'pending' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;

-- ============================================
-- DEV TABLE (for testing without RLS)
-- ============================================

CREATE TABLE IF NOT EXISTS public.dev_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  assigned_to UUID,
  lead_id UUID,
  status VARCHAR(30) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'normal',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dev_tasks_assigned ON dev_tasks(assigned_to, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_dev_tasks_lead ON dev_tasks(lead_id) WHERE lead_id IS NOT NULL;
