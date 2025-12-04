-- Fix the security definer view issue by explicitly setting security invoker
DROP VIEW IF EXISTS public.tests_public;

CREATE VIEW public.tests_public 
WITH (security_invoker = true)
AS
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