-- Migration: Create subscriptions table and related functions
-- Run this in Supabase SQL Editor

-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'simple', 'premium')),
  status TEXT NOT NULL CHECK (status IN ('active', 'pending', 'cancelled', 'expired')) DEFAULT 'pending',
  mercadopago_subscription_id TEXT UNIQUE,
  mercadopago_preapproval_id TEXT UNIQUE,
  next_payment_date TIMESTAMP WITH TIME ZONE,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_user_subscription UNIQUE(user_id)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment ON subscriptions(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mercadopago_id ON subscriptions(mercadopago_subscription_id);

-- 3. Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Users can read their own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only authenticated users can insert (will be done via Edge Function)
CREATE POLICY "Authenticated users can insert subscription"
  ON subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscription (for cancellation)
CREATE POLICY "Users can update own subscription"
  ON subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Create function to check expired subscriptions
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS TABLE(expired_count INTEGER) AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE subscriptions
  SET 
    status = 'expired',
    cancelled_at = NOW(),
    updated_at = NOW()
  WHERE 
    status = 'active'
    AND next_payment_date < NOW()
    AND next_payment_date IS NOT NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN QUERY SELECT updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to get user subscription with features
CREATE OR REPLACE FUNCTION get_user_subscription_features(p_user_id UUID)
RETURNS TABLE(
  plan_type TEXT,
  status TEXT,
  has_calorie_tracking BOOLEAN,
  has_price_sum BOOLEAN,
  has_family_plan BOOLEAN,
  has_priority_support BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.plan_type,
    s.status,
    CASE 
      WHEN s.status = 'active' AND s.plan_type IN ('simple', 'premium') THEN TRUE
      ELSE FALSE
    END as has_calorie_tracking,
    CASE 
      WHEN s.status = 'active' AND s.plan_type IN ('simple', 'premium') THEN TRUE
      ELSE FALSE
    END as has_price_sum,
    CASE 
      WHEN s.status = 'active' AND s.plan_type = 'premium' THEN TRUE
      ELSE FALSE
    END as has_family_plan,
    CASE 
      WHEN s.status = 'active' AND s.plan_type = 'premium' THEN TRUE
      ELSE FALSE
    END as has_priority_support
  FROM subscriptions s
  WHERE s.user_id = p_user_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Add subscription_id to perfis_usuario if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'perfis_usuario' AND column_name = 'subscription_id'
  ) THEN
    ALTER TABLE perfis_usuario
    ADD COLUMN subscription_id UUID REFERENCES subscriptions(id);
  END IF;
END $$;

-- 9. Create default free subscription for existing users
INSERT INTO subscriptions (user_id, plan_type, status, next_payment_date)
SELECT 
  id,
  'free',
  'active',
  NULL
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions WHERE subscriptions.user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION check_expired_subscriptions() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_features(UUID) TO authenticated;

-- Verification query
SELECT 
  'subscriptions' as table_name,
  COUNT(*) as row_count
FROM subscriptions
UNION ALL
SELECT 
  'indexes' as table_name,
  COUNT(*) as row_count
FROM pg_indexes
WHERE tablename = 'subscriptions';
