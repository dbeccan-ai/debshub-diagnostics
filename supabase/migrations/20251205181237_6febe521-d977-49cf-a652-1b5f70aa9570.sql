-- Create schools table
CREATE TABLE public.schools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  setup_code TEXT NOT NULL UNIQUE DEFAULT upper(substring(md5(random()::text), 1, 8)),
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Add school_id to profiles
ALTER TABLE public.profiles ADD COLUMN school_id UUID REFERENCES public.schools(id);

-- Add school_id to classes (replace school_name text with proper FK)
ALTER TABLE public.classes ADD COLUMN school_id UUID REFERENCES public.schools(id);

-- Add school_id to test_attempts for data isolation
ALTER TABLE public.test_attempts ADD COLUMN school_id UUID REFERENCES public.schools(id);

-- Create function to get user's school_id
CREATE OR REPLACE FUNCTION public.get_user_school_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- RLS Policies for schools table
-- Admins can view their own school
CREATE POLICY "Users can view their school"
ON public.schools
FOR SELECT
USING (
  id = public.get_user_school_id(auth.uid())
  OR NOT is_claimed
);

-- Only unclaimed schools can be claimed (updated during setup)
CREATE POLICY "Admins can update their school"
ON public.schools
FOR UPDATE
USING (id = public.get_user_school_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- Update profiles RLS to include school isolation for admins/teachers viewing students
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view profiles in their school"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR (
    school_id IS NOT NULL 
    AND school_id = public.get_user_school_id(auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
  )
);

-- Update test_attempts RLS for school isolation
CREATE POLICY "Admins can view school test attempts"
ON public.test_attempts
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (
    school_id IS NOT NULL 
    AND school_id = public.get_user_school_id(auth.uid())
    AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
  )
);

-- Update classes RLS for school isolation
DROP POLICY IF EXISTS "Teachers can view own classes" ON public.classes;
CREATE POLICY "Teachers can view school classes"
ON public.classes
FOR SELECT
USING (
  teacher_id = auth.uid() 
  OR (
    school_id IS NOT NULL 
    AND school_id = public.get_user_school_id(auth.uid())
    AND has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Update invitations to include school_id
ALTER TABLE public.invitations ADD COLUMN school_id UUID REFERENCES public.schools(id);

-- Update invitations RLS for school scope
DROP POLICY IF EXISTS "Admins can view all invitations" ON public.invitations;
CREATE POLICY "Admins can view school invitations"
ON public.invitations
FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND (school_id IS NULL OR school_id = public.get_user_school_id(auth.uid()))
);

DROP POLICY IF EXISTS "Admins can create invitations" ON public.invitations;
CREATE POLICY "Admins can create school invitations"
ON public.invitations
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND school_id = public.get_user_school_id(auth.uid())
);

-- Trigger to update updated_at
CREATE TRIGGER update_schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();