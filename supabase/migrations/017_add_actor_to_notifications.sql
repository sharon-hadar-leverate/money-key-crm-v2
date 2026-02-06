-- Add actor_user_id to notifications table
-- Tracks which user performed the action that triggered the notification
-- Nullable: existing rows and system-generated notifications have no actor

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS actor_user_id UUID;

ALTER TABLE dev_notifications
  ADD COLUMN IF NOT EXISTS actor_user_id UUID;

-- Index for filtering by actor
CREATE INDEX IF NOT EXISTS idx_notifications_actor ON notifications (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_dev_notifications_actor ON dev_notifications (actor_user_id);
