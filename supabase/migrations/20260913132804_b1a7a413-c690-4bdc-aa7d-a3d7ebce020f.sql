CREATE TABLE public.tachs_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attempt_id uuid REFERENCES public.tachs_attempts(id) ON DELETE SET NULL,
  exam_type text NOT NULL DEFAULT 'tachs' CHECK (exam_type = 'tachs'),
  source text NOT NULL DEFAULT 'stripe' CHECK (source IN ('stripe','admin_grant','legacy')),
  net_amount_cents integer NOT NULL DEFAULT 17500,
  fee_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  amount_paid_cents integer,
  currency text NOT NULL DEFAULT 'usd',
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','completed','failed','refunded','granted')),
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text UNIQUE,
  integration_identifier text,
  granted_by uuid REFERENCES public.profiles(id),
  grant_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz
);
CREATE UNIQUE INDEX uq_tachs_orders_one_pending_per_user ON public.tachs_orders (user_id) WHERE payment_status = 'pending';
CREATE UNIQUE INDEX uq_tachs_orders_attempt ON public.tachs_orders (attempt_id) WHERE attempt_id IS NOT NULL;
CREATE INDEX idx_tachs_orders_user ON public.tachs_orders (user_id, created_at DESC);
GRANT SELECT ON public.tachs_orders TO authenticated;
GRANT ALL ON public.tachs_orders TO service_role;
ALTER TABLE public.tachs_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own TACHS orders" ON public.tachs_orders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all TACHS orders" ON public.tachs_orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_tachs_orders_updated_at BEFORE UPDATE ON public.tachs_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tachs_attempts
  ADD COLUMN order_id uuid REFERENCES public.tachs_orders(id) ON DELETE SET NULL,
  ADD COLUMN access_source text NOT NULL DEFAULT 'unentitled'
    CHECK (access_source IN ('unentitled','paid','admin_grant','test_mode','legacy'));

UPDATE public.tachs_attempts SET access_source = 'test_mode' WHERE test_mode = true;
UPDATE public.tachs_attempts SET access_source = 'legacy' WHERE test_mode = false;
INSERT INTO public.tachs_attempt_events (attempt_id, event_type, detail)
SELECT id, 'legacy_entitlement', jsonb_build_object('reason', 'Attempt predates the TACHS payment feature; preserved as legacy access.')
FROM public.tachs_attempts WHERE access_source = 'legacy';