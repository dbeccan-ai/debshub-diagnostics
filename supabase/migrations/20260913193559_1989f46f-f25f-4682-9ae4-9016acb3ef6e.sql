ALTER TABLE public.tachs_attempts
  ADD COLUMN IF NOT EXISTS report_status text NOT NULL DEFAULT 'draft' CHECK (report_status IN ('draft','reviewed','approved','sent')),
  ADD COLUMN IF NOT EXISTS report_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS report_reviewed_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS report_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS report_approved_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS report_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS report_notes text,
  ADD COLUMN IF NOT EXISTS ack_email_status text NOT NULL DEFAULT 'pending' CHECK (ack_email_status IN ('pending','sent','failed','skipped')),
  ADD COLUMN IF NOT EXISTS ack_email_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS ack_email_error text;