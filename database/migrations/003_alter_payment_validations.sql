-- Migration: Alter payment_validations table to match Mercado Pago webhook structure
-- This migration adjusts the payment_validations table to store detailed returns from the payment gateway.

-- Down script (optional, for rollback)
/*
DROP TABLE IF EXISTS payment_validations;
ALTER TABLE payment_validations_old RENAME TO payment_validations;
*/

-- 1. Drop existing RLS policies and trigger from the old table to avoid conflicts.
-- Note: Policy and trigger names are taken from the previous migration file.
DROP POLICY IF EXISTS "Users can view own payment validations" ON public.payment_validations;
DROP POLICY IF EXISTS "Authenticated users can insert payment validation" ON public.payment_validations;
DROP POLICY IF EXISTS "Service roles can update payment validations" ON public.payment_validations;
DROP TRIGGER IF EXISTS update_payment_validations_updated_at ON public.payment_validations;

-- 2. Rename the current table for backup purposes
ALTER TABLE IF EXISTS public.payment_validations RENAME TO payment_validations_old;

-- 3. Create the new payment_validations table with the required schema
CREATE TABLE IF NOT EXISTS public.payment_validations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Use SET NULL to keep payment records even if a user is deleted
  payment_id TEXT NOT NULL UNIQUE,
  status_pagamento TEXT NOT NULL, -- e.g., 'approved', 'pending', 'rejected', 'cancelled'
  valor DECIMAL(10, 2),
  metodo_pagamento TEXT,
  data_pagamento TIMESTAMP WITH TIME ZONE,
  payload_retorno JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Add comments to columns for clarity
COMMENT ON COLUMN public.payment_validations.id IS 'Sequential primary key.';
COMMENT ON COLUMN public.payment_validations.user_id IS 'Reference to the user who initiated the payment.';
COMMENT ON COLUMN public.payment_validations.payment_id IS 'Unique payment identifier from Mercado Pago.';
COMMENT ON COLUMN public.payment_validations.status_pagamento IS 'The payment status returned by Mercado Pago (e.g., approved, rejected).';
COMMENT ON COLUMN public.payment_validations.valor IS 'The value of the payment.';
COMMENT ON COLUMN public.payment_validations.metodo_pagamento IS 'Payment method used (e.g., credit_card).';
COMMENT ON COLUMN public.payment_validations.data_pagamento IS 'Timestamp of when the payment was processed.';
COMMENT ON COLUMN public.payment_validations.payload_retorno IS 'The complete JSON payload received from the Mercado Pago webhook.';
COMMENT ON COLUMN public.payment_validations.created_at IS 'Timestamp of when the webhook notification was recorded.';


-- 5. Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_payment_validations_user_id ON public.payment_validations(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_validations_payment_id ON public.payment_validations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_validations_status_pagamento ON public.payment_validations(status_pagamento);

-- 6. Enable Row Level Security (RLS) on the new table
ALTER TABLE public.payment_validations ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for the new table
-- Webhook handlers (service_role) need to be able to insert payment notifications.
CREATE POLICY "Allow service_role to insert payment validations"
  ON public.payment_validations
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Users should not be able to see this table directly. It's a backend-only log.
-- If needed, a specific policy can be created for users to see their own *approved* payments,
-- but it's safer to expose this data via a controlled RPC function. For now, no user access.

-- Allow service_role to read all data (for checking idempotency, etc.)
CREATE POLICY "Allow service_role to read all payment validations"
  ON public.payment_validations
  FOR SELECT
  TO service_role
  USING (true);

-- 8. Grant permissions
-- Grant all permissions to the supabase_admin role, which is standard.
GRANT ALL ON TABLE public.payment_validations TO postgres;
-- Allow the service_role (used by Edge Functions) to perform all actions.
GRANT ALL ON TABLE public.payment_validations TO service_role;
-- Make sure the service_role can use the sequence for the primary key.
GRANT USAGE, SELECT ON SEQUENCE payment_validations_id_seq TO service_role;


-- Verification
SELECT 'New payment_validations table created and secured.' AS step;
