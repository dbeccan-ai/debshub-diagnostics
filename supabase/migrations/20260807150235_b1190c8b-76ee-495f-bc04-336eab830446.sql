CREATE TABLE public.follow_up_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_attempt_id uuid REFERENCES public.test_attempts(id) ON DELETE SET NULL,
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  grade_level integer,
  checkpoint_label text NOT NULL DEFAULT 'Week 5',
  week_number integer,
  unlock_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'scheduled',
  school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  result_attempt_id uuid REFERENCES public.test_attempts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_follow_up_student ON public.follow_up_assessments(student_id);
CREATE INDEX idx_follow_up_source ON public.follow_up_assessments(source_attempt_id);
CREATE UNIQUE INDEX idx_follow_up_unique_checkpoint ON public.follow_up_assessments(source_attempt_id, week_number) WHERE source_attempt_id IS NOT NULL AND week_number IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_up_assessments TO authenticated;
GRANT ALL ON public.follow_up_assessments TO service_role;

ALTER TABLE public.follow_up_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own follow-ups"
ON public.follow_up_assessments FOR SELECT TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Students can update their own follow-ups"
ON public.follow_up_assessments FOR UPDATE TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Admins can manage all follow-ups"
ON public.follow_up_assessments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage school follow-ups"
ON public.follow_up_assessments FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher')
  AND school_id IS NOT NULL
  AND school_id = public.get_user_school_id(auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'teacher')
  AND school_id IS NOT NULL
  AND school_id = public.get_user_school_id(auth.uid())
);

CREATE TRIGGER update_follow_up_assessments_updated_at
BEFORE UPDATE ON public.follow_up_assessments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.test_attempts
  ADD COLUMN IF NOT EXISTS follow_up_id uuid REFERENCES public.follow_up_assessments(id) ON DELETE SET NULL;