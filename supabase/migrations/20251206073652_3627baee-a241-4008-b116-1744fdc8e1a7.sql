-- Drop existing view and recreate with SECURITY INVOKER = false (SECURITY DEFINER equivalent for views)
DROP VIEW IF EXISTS public.tests_public;

-- Create the view with security_invoker = false so it bypasses RLS on the underlying tests table
CREATE VIEW public.tests_public
WITH (security_invoker = false)
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

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.tests_public TO authenticated;
GRANT SELECT ON public.tests_public TO anon;