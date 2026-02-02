-- Add income calculation fields to leads table
-- refund_amount: The amount of refund (גובה החזר)
-- commission_rate: Commission percentage (אחוז עמלה) - 0 to 100

-- Add columns to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS refund_amount NUMERIC;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS commission_rate NUMERIC;

-- Add columns to dev_leads table as well
ALTER TABLE public.dev_leads ADD COLUMN IF NOT EXISTS refund_amount NUMERIC;
ALTER TABLE public.dev_leads ADD COLUMN IF NOT EXISTS commission_rate NUMERIC;

-- Add check constraint for commission_rate (0-100%) on leads table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_commission_rate_range') THEN
        ALTER TABLE public.leads ADD CONSTRAINT leads_commission_rate_range
            CHECK (commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 100));
    END IF;
END $$;

-- Add check constraint for commission_rate (0-100%) on dev_leads table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dev_leads_commission_rate_range') THEN
        ALTER TABLE public.dev_leads ADD CONSTRAINT dev_leads_commission_rate_range
            CHECK (commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 100));
    END IF;
END $$;

-- Add comments
COMMENT ON COLUMN public.leads.refund_amount IS 'Refund amount in ILS (גובה החזר)';
COMMENT ON COLUMN public.leads.commission_rate IS 'Commission rate percentage 0-100 (אחוז עמלה)';
COMMENT ON COLUMN public.dev_leads.refund_amount IS 'Refund amount in ILS (גובה החזר)';
COMMENT ON COLUMN public.dev_leads.commission_rate IS 'Commission rate percentage 0-100 (אחוז עמלה)';
