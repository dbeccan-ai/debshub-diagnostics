-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view tests" ON public.tests;

-- Create a view that exposes only test metadata (no questions/answers)
CREATE OR REPLACE VIEW public.tests_public AS
SELECT 
  id,
  name,
  description,
  duration_minutes,
  is_paid,
  price,
  test_type,
  created_at,
  updated_at
FROM public.tests;

-- Grant SELECT on the view to authenticated and anon users
GRANT SELECT ON public.tests_public TO authenticated;
GRANT SELECT ON public.tests_public TO anon;

-- Create a restrictive policy - only admins can view the full tests table
CREATE POLICY "Only admins can view full tests" 
ON public.tests 
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));