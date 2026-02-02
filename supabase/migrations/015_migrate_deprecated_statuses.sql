-- Migration: 015_migrate_deprecated_statuses.sql
-- Move leads from deprecated statuses to new ones
-- Removes: completed, paying_customer, contacted

-- completed → waiting_for_payment
UPDATE leads SET status = 'waiting_for_payment', updated_at = NOW()
WHERE status = 'completed' AND deleted_at IS NULL;

-- paying_customer → payment_completed
UPDATE leads SET status = 'payment_completed', updated_at = NOW()
WHERE status = 'paying_customer' AND deleted_at IS NULL;

-- contacted → message_sent
UPDATE leads SET status = 'message_sent', updated_at = NOW()
WHERE status = 'contacted' AND deleted_at IS NULL;

-- Same for dev_leads table
UPDATE dev_leads SET status = 'waiting_for_payment', updated_at = NOW()
WHERE status = 'completed' AND deleted_at IS NULL;

UPDATE dev_leads SET status = 'payment_completed', updated_at = NOW()
WHERE status = 'paying_customer' AND deleted_at IS NULL;

UPDATE dev_leads SET status = 'message_sent', updated_at = NOW()
WHERE status = 'contacted' AND deleted_at IS NULL;
