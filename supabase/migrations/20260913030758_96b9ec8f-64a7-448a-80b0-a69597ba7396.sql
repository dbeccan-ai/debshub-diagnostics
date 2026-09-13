-- TACHS Readiness Diagnostic schema (v1)

CREATE TABLE public.tachs_blueprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version integer NOT NULL UNIQUE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  sections jsonb NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tachs_blueprints TO authenticated;
GRANT ALL ON public.tachs_blueprints TO service_role;
ALTER TABLE public.tachs_blueprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view blueprints" ON public.tachs_blueprints
  FOR SELECT TO authenticated USING (true);
CREATE TRIGGER update_tachs_blueprints_updated_at BEFORE UPDATE ON public.tachs_blueprints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tachs_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  blueprint_version integer NOT NULL,
  section_key text NOT NULL,
  skill text NOT NULL,
  difficulty smallint NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  stem text NOT NULL,
  passage_id text,
  passage_title text,
  passage_text text,
  visual jsonb,
  visual_alt text,
  choices jsonb NOT NULL,
  correct_key text NOT NULL,
  rationale text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tachs_questions_section ON public.tachs_questions (blueprint_version, section_key, difficulty) WHERE is_active;
GRANT SELECT ON public.tachs_questions TO authenticated;
GRANT ALL ON public.tachs_questions TO service_role;
ALTER TABLE public.tachs_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view question bank" ON public.tachs_questions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_tachs_questions_updated_at BEFORE UPDATE ON public.tachs_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tachs_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id),
  blueprint_id uuid NOT NULL REFERENCES public.tachs_blueprints(id),
  blueprint_version integer NOT NULL,
  grade_level integer,
  parent_email text,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','abandoned')),
  test_mode boolean NOT NULL DEFAULT false,
  current_section_key text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  results jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_tachs_one_in_progress_per_user ON public.tachs_attempts (user_id) WHERE status = 'in_progress';
CREATE INDEX idx_tachs_attempts_user ON public.tachs_attempts (user_id, created_at DESC);
GRANT SELECT ON public.tachs_attempts TO authenticated;
GRANT ALL ON public.tachs_attempts TO service_role;
ALTER TABLE public.tachs_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own TACHS attempts" ON public.tachs_attempts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all TACHS attempts" ON public.tachs_attempts
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_tachs_attempts_updated_at BEFORE UPDATE ON public.tachs_attempts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tachs_attempt_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.tachs_attempts(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  section_order integer NOT NULL,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','submitted')),
  item_count integer NOT NULL,
  time_limit_seconds integer NOT NULL,
  started_at timestamptz,
  deadline_at timestamptz,
  submitted_at timestamptz,
  time_used_seconds integer,
  submit_reason text,
  presented_question_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_difficulty smallint NOT NULL DEFAULT 2,
  streak_correct integer NOT NULL DEFAULT 0,
  streak_incorrect integer NOT NULL DEFAULT 0,
  difficulty_path jsonb NOT NULL DEFAULT '[]'::jsonb,
  quotas_remaining jsonb NOT NULL DEFAULT '{}'::jsonb,
  break_after_seconds integer NOT NULL DEFAULT 0,
  summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, section_key)
);
GRANT SELECT ON public.tachs_attempt_sections TO authenticated;
GRANT ALL ON public.tachs_attempt_sections TO service_role;
ALTER TABLE public.tachs_attempt_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own TACHS sections" ON public.tachs_attempt_sections
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.tachs_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid())
  );
CREATE POLICY "Admins view all TACHS sections" ON public.tachs_attempt_sections
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_tachs_attempt_sections_updated_at BEFORE UPDATE ON public.tachs_attempt_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.tachs_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.tachs_attempts(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.tachs_attempt_sections(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.tachs_questions(id),
  position integer NOT NULL,
  difficulty smallint NOT NULL,
  skill text NOT NULL,
  selected_key text,
  is_flagged boolean NOT NULL DEFAULT false,
  is_correct boolean,
  time_spent_seconds integer NOT NULL DEFAULT 0,
  presented_at timestamptz NOT NULL DEFAULT now(),
  answered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (section_id, question_id),
  UNIQUE (section_id, position)
);
GRANT SELECT ON public.tachs_responses TO authenticated;
GRANT ALL ON public.tachs_responses TO service_role;
ALTER TABLE public.tachs_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students view own TACHS responses after completion" ON public.tachs_responses
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.tachs_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid() AND a.status = 'completed')
  );
CREATE POLICY "Admins view all TACHS responses" ON public.tachs_responses
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_tachs_responses_updated_at BEFORE UPDATE ON public.tachs_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();