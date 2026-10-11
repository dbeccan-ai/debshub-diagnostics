-- Item 1: stable student identity + school scope; Item 2: WCPM/timing; Item 3: pre/post tracking
ALTER TABLE public.reading_diagnostic_transcripts
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id),
  ADD COLUMN IF NOT EXISTS passage_form_version text,
  ADD COLUMN IF NOT EXISTS reading_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS wcpm numeric;

ALTER TABLE public.reading_recovery_enrollments
  ADD COLUMN IF NOT EXISTS student_id uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id),
  ADD COLUMN IF NOT EXISTS version_c_completed_at timestamp with time zone;

-- Additive backfill of school_id from the owning adult's profile
UPDATE public.reading_diagnostic_transcripts t
SET school_id = p.school_id
FROM public.profiles p
WHERE t.user_id = p.id AND t.school_id IS NULL AND p.school_id IS NOT NULL;

UPDATE public.reading_recovery_enrollments e
SET school_id = p.school_id
FROM public.profiles p
WHERE e.user_id = p.id AND e.school_id IS NULL AND p.school_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rdt_school_id ON public.reading_diagnostic_transcripts(school_id);
CREATE INDEX IF NOT EXISTS idx_rdt_student_id ON public.reading_diagnostic_transcripts(student_id);
CREATE INDEX IF NOT EXISTS idx_rre_school_id ON public.reading_recovery_enrollments(school_id);

-- Teacher school-scoped read access (admins already covered by existing policies)
CREATE POLICY "Teachers can view their school's reading transcripts"
ON public.reading_diagnostic_transcripts
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher')
  AND school_id IS NOT NULL
  AND school_id = public.get_user_school_id(auth.uid())
);

CREATE POLICY "Teachers can view their school's reading enrollments"
ON public.reading_recovery_enrollments
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher')
  AND school_id IS NOT NULL
  AND school_id = public.get_user_school_id(auth.uid())
);

CREATE POLICY "Teachers can view their school's reading progress"
ON public.reading_recovery_progress
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher')
  AND EXISTS (
    SELECT 1 FROM public.reading_recovery_enrollments e
    WHERE e.id = enrollment_id
      AND e.school_id IS NOT NULL
      AND e.school_id = public.get_user_school_id(auth.uid())
  )
);