-- TACHS parent report: consultant-controlled, parent-safe content structure.
-- Additive and nullable: no existing row is modified. Populated only by the admin workflow.
ALTER TABLE public.tachs_attempts
  ADD COLUMN IF NOT EXISTS parent_report_content jsonb;

COMMENT ON COLUMN public.tachs_attempts.parent_report_content IS
  'Consultant-controlled parent-facing report content (interpretation, priority_sections, recommended_program_key, customized_next_steps, price_override_cents, credit_expires_at, approved_for_parent_at). Never item-level data; report_notes stays internal.';