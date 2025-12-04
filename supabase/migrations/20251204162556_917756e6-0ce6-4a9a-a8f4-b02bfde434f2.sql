-- Drop existing UPDATE policy on test_attempts
DROP POLICY IF EXISTS "Users can update own test attempts" ON public.test_attempts;

-- Create a more restrictive UPDATE policy that excludes payment fields
-- Users can only update non-payment fields
CREATE POLICY "Users can update own test attempts (restricted)"
ON public.test_attempts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
);

-- Create a function to prevent payment_status updates from non-service role
CREATE OR REPLACE FUNCTION public.check_payment_status_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If payment_status is being changed and not by service role
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    -- Check if this is a service role update (service role bypasses RLS)
    -- Regular users shouldn't be able to change payment_status
    IF current_setting('role') != 'service_role' AND current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
      RAISE EXCEPTION 'payment_status can only be updated by the system';
    END IF;
  END IF;
  
  -- Same for amount_paid
  IF OLD.amount_paid IS DISTINCT FROM NEW.amount_paid THEN
    IF current_setting('role') != 'service_role' AND current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' THEN
      RAISE EXCEPTION 'amount_paid can only be updated by the system';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce payment field protection
DROP TRIGGER IF EXISTS protect_payment_fields ON public.test_attempts;
CREATE TRIGGER protect_payment_fields
  BEFORE UPDATE ON public.test_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_payment_status_update();