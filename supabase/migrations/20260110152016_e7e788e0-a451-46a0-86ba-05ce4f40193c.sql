-- Fix get_email_from_username to be case-insensitive
CREATE OR REPLACE FUNCTION public.get_email_from_username(input_username text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.email
  FROM public.profiles p
  JOIN auth.users au ON p.id = au.id
  WHERE LOWER(p.username) = LOWER(input_username)
  LIMIT 1;
$$;