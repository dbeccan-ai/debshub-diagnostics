-- Add username and parent_email to profiles table
ALTER TABLE public.profiles
ADD COLUMN username text UNIQUE,
ADD COLUMN parent_email text;

-- Create index for faster username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Create a public function to lookup parent email from username
-- This is needed for login since we need to convert username to email
CREATE OR REPLACE FUNCTION public.get_email_from_username(input_username text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT parent_email
  FROM public.profiles
  WHERE username = input_username
  LIMIT 1;
$$;

-- Update the handle_new_user function to include username and parent_email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, parent_email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Student'),
    new.raw_user_meta_data->>'username',
    new.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'student');
  
  RETURN new;
END;
$$;