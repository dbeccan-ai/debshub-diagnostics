
CREATE TABLE public.phonics_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  enrollment_id uuid NULL,
  day_number integer NULL,
  target text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('letter','word')),
  correct boolean NOT NULL,
  heard text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.phonics_attempts TO authenticated;
GRANT ALL ON public.phonics_attempts TO service_role;

ALTER TABLE public.phonics_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert their own phonics attempts"
  ON public.phonics_attempts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can view their own phonics attempts"
  ON public.phonics_attempts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all phonics attempts"
  ON public.phonics_attempts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view phonics attempts in their school"
  ON public.phonics_attempts FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'teacher')
    AND EXISTS (
      SELECT 1 FROM public.profiles p1
      JOIN public.profiles p2 ON p2.school_id = p1.school_id
      WHERE p1.id = auth.uid() AND p2.id = phonics_attempts.user_id
    )
  );

CREATE INDEX idx_phonics_attempts_user_day ON public.phonics_attempts(user_id, day_number);
