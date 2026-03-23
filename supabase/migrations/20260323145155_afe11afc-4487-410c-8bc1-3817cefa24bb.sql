
CREATE TABLE public.demo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text,
  school_name text NOT NULL,
  district text,
  email text NOT NULL,
  phone text,
  student_count integer,
  grade_levels text[],
  package_interest text,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (public form)
CREATE POLICY "Anyone can submit demo requests"
ON public.demo_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admin-only select
CREATE POLICY "Admins can view demo requests"
ON public.demo_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
