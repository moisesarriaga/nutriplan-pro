-- Migration: Create payment_validations table
-- This table temporarily stores payment intents before they are confirmed by the webhook.

-- 1. Create payment_validations table
CREATE TABLE IF NOT EXISTS payment_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payment_id TEXT NOT NULL UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('simple', 'premium')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_validations_user_id ON payment_validations(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_validations_payment_id ON payment_validations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_validations_status ON payment_validations(status);

-- 3. Enable Row Level Security
ALTER TABLE payment_validations ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Users can view their own payment validation entries
CREATE POLICY "Users can view own payment validations"
  ON payment_validations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can insert their own payment validation entries
CREATE POLICY "Authenticated users can insert payment validation"
  ON payment_validations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service roles (like Edge Functions) can update entries
CREATE POLICY "Service roles can update payment validations"
  ON payment_validations
  FOR UPDATE
  USING (true); -- Broad access for service role updates, relying on function security.

-- 5. Create trigger to update updated_at timestamp
CREATE TRIGGER update_payment_validations_updated_at
  BEFORE UPDATE ON payment_validations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); -- Reuse function from previous migration

-- 6. Grant necessary permissions
GRANT ALL ON payment_validations TO authenticated;

-- Verification
SELECT 'payment_validations table created' AS step;
