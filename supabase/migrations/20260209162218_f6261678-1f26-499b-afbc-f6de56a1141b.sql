
-- Allow admins to view all reading diagnostic transcripts
CREATE POLICY "Admins can view all transcripts"
ON public.reading_diagnostic_transcripts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all reading recovery enrollments
CREATE POLICY "Admins can view all enrollments"
ON public.reading_recovery_enrollments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
