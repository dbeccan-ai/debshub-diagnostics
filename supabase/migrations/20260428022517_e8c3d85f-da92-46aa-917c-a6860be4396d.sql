ALTER TABLE public.test_responses
  ADD COLUMN IF NOT EXISTS points_awarded numeric,
  ADD COLUMN IF NOT EXISTS max_points numeric,
  ADD COLUMN IF NOT EXISTS teacher_comment text;

-- Backfill existing graded rows so score math stays consistent
UPDATE public.test_responses
SET points_awarded = CASE WHEN is_correct THEN 1 ELSE 0 END,
    max_points = 1
WHERE is_correct IS NOT NULL
  AND points_awarded IS NULL;

-- Allow teachers/admins to update responses (grading): partial points + comments
CREATE POLICY "Teachers and admins can grade responses"
ON public.test_responses
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'teacher'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'teacher'::app_role)
);