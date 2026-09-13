ALTER TABLE public.tachs_attempts
  ADD COLUMN IF NOT EXISTS email_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS email_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_error text,
  ADD COLUMN IF NOT EXISTS email_sent_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS reopened_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS reopened_by uuid;

CREATE INDEX IF NOT EXISTS tachs_attempts_status_idx ON public.tachs_attempts (status, created_at DESC);
CREATE INDEX IF NOT EXISTS tachs_attempts_email_status_idx ON public.tachs_attempts (email_status);

CREATE TABLE IF NOT EXISTS public.tachs_attempt_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.tachs_attempts(id) ON DELETE CASCADE,
  actor_id uuid,
  event_type text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tachs_attempt_events TO authenticated;
GRANT ALL ON public.tachs_attempt_events TO service_role;

ALTER TABLE public.tachs_attempt_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view TACHS attempt events"
ON public.tachs_attempt_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS tachs_attempt_events_attempt_idx ON public.tachs_attempt_events (attempt_id, created_at DESC);