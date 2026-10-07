CREATE TABLE public.shsat_taxonomy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  section text NOT NULL CHECK (section IN ('ELA','Math')),
  domain text NOT NULL,
  skill text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shsat_taxonomy TO anon, authenticated;
GRANT ALL ON public.shsat_taxonomy TO service_role;
ALTER TABLE public.shsat_taxonomy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read SHSAT taxonomy" ON public.shsat_taxonomy FOR SELECT USING (true);

CREATE TABLE public.shsat_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  program text NOT NULL DEFAULT 'SHSAT' CHECK (program = 'SHSAT'),
  section text NOT NULL CHECK (section IN ('ELA','Math')),
  primary_domain text NOT NULL,
  tested_skill text NOT NULL,
  prerequisite_skill text,
  prerequisite_grade_band text,
  cognitive_demand text,
  difficulty_level smallint CHECK (difficulty_level BETWEEN 1 AND 5),
  error_type_tags text[] NOT NULL DEFAULT '{}',
  intervention_strand text,
  source_type text NOT NULL DEFAULT 'debs_proprietary' CHECK (source_type IN ('debs_proprietary','official_style_practice','legacy_blueprint_reference')),
  source_year integer,
  source_reference jsonb NOT NULL DEFAULT '{}'::jsonb,
  passage_set_id text,
  item_format text NOT NULL DEFAULT 'multiple_choice',
  stem text NOT NULL,
  choices jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer text NOT NULL,
  explanation text,
  is_active boolean NOT NULL DEFAULT false,
  adaptive_pool_eligible boolean NOT NULL DEFAULT false,
  grade_pathway text NOT NULL DEFAULT 'both' CHECK (grade_pathway IN ('8-test','9-test','both')),
  calibration_status text NOT NULL DEFAULT 'uncalibrated' CHECK (calibration_status IN ('uncalibrated','field_testing','calibrated','retired')),
  version integer NOT NULL DEFAULT 1,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shsat_items_section_domain_idx ON public.shsat_items(section, primary_domain);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shsat_items TO authenticated;
GRANT ALL ON public.shsat_items TO service_role;
ALTER TABLE public.shsat_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage SHSAT items" ON public.shsat_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.shsat_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_id uuid,
  student_first_name text NOT NULL,
  student_last_name text NOT NULL,
  current_grade text NOT NULL CHECK (current_grade IN ('6','7','8','9')),
  current_school text,
  nyc_resident boolean,
  shsat_registered text CHECK (shsat_registered IN ('yes','no','not_sure')),
  prior_shsat_practice boolean,
  math_performance_band text,
  ela_performance_band text,
  target_schools text[] NOT NULL DEFAULT '{}',
  parent_email text NOT NULL,
  pathway text NOT NULL CHECK (pathway IN ('testing_this_november','preparing_next_year','long_range_6_7')),
  placement text CHECK (placement IN ('shsat_ready','shsat_developing','shsat_foundation','long_range_pathway')),
  placement_set_by uuid,
  placement_set_at timestamptz,
  placement_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.shsat_intakes TO authenticated;
GRANT ALL ON public.shsat_intakes TO service_role;
ALTER TABLE public.shsat_intakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own SHSAT intake" ON public.shsat_intakes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users create own SHSAT intake" ON public.shsat_intakes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND placement IS NULL);
CREATE POLICY "Users update own SHSAT intake" ON public.shsat_intakes FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- Prevent non-admins from setting placement fields
CREATE OR REPLACE FUNCTION public.shsat_intake_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.placement := NULL; NEW.placement_set_by := NULL; NEW.placement_set_at := NULL; NEW.placement_notes := NULL;
    ELSE
      NEW.placement := OLD.placement; NEW.placement_set_by := OLD.placement_set_by;
      NEW.placement_set_at := OLD.placement_set_at; NEW.placement_notes := OLD.placement_notes;
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER shsat_intake_guard BEFORE INSERT OR UPDATE ON public.shsat_intakes
  FOR EACH ROW EXECUTE FUNCTION public.shsat_intake_guard();

CREATE TABLE public.shsat_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  assessment_enabled boolean NOT NULL DEFAULT false,
  placement_rules_calibrated boolean NOT NULL DEFAULT false,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shsat_settings TO anon, authenticated;
GRANT UPDATE ON public.shsat_settings TO authenticated;
GRANT ALL ON public.shsat_settings TO service_role;
ALTER TABLE public.shsat_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads SHSAT settings" ON public.shsat_settings FOR SELECT USING (true);
CREATE POLICY "Admins update SHSAT settings" ON public.shsat_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER shsat_items_updated BEFORE UPDATE ON public.shsat_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER shsat_taxonomy_updated BEFORE UPDATE ON public.shsat_taxonomy FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();