-- ============================================
-- NOTIFICATION CENTER
-- ============================================
-- Stores notifications for all CRM activities:
-- - new_lead: New lead created
-- - status_change: Lead status updated
-- - note_added: Note added to lead
-- - questionnaire_filled: Questionnaire completed
-- - task_assigned: Task assigned to user
-- - task_due: Task due date approaching

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,                    -- Who receives this notification
  type VARCHAR(50) NOT NULL,                -- 'new_lead', 'status_change', 'note_added', 'questionnaire_filled', 'task_assigned', 'task_due'
  title TEXT NOT NULL,                      -- Hebrew notification title
  body TEXT,                                -- Additional details

  -- Related entity (polymorphic)
  entity_type VARCHAR(30),                  -- 'lead', 'questionnaire', 'task'
  entity_id UUID,                           -- ID of the related record

  -- State
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- For grouping/filtering
  metadata JSONB DEFAULT '{}'               -- Extra data (lead name, old/new status, etc.)
);

COMMENT ON TABLE public.notifications IS 'התראות - Notifications for all CRM activities';
COMMENT ON COLUMN public.notifications.type IS 'Notification type: new_lead, status_change, note_added, questionnaire_filled, task_assigned, task_due';
COMMENT ON COLUMN public.notifications.entity_type IS 'Related entity type: lead, questionnaire, task';
COMMENT ON COLUMN public.notifications.metadata IS 'Additional notification data: {lead_name, old_status, new_status, ...}';

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = false;

-- ============================================
-- DEV TABLE (for testing without RLS)
-- ============================================

CREATE TABLE IF NOT EXISTS public.dev_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  entity_type VARCHAR(30),
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_dev_notifications_user ON dev_notifications(user_id, is_read, created_at DESC);
