-- Add grade level to test attempts for pricing
ALTER TABLE test_attempts 
ADD COLUMN IF NOT EXISTS grade_level integer,
ADD COLUMN IF NOT EXISTS amount_paid numeric;

-- Create payments table to track Stripe transactions
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES test_attempts(id) ON DELETE CASCADE,
  stripe_payment_intent_id text UNIQUE,
  amount numeric NOT NULL,
  currency text DEFAULT 'usd',
  status text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
ON payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM test_attempts
    WHERE test_attempts.id = payments.attempt_id
    AND test_attempts.user_id = auth.uid()
  )
);

-- Update trigger for payments
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();