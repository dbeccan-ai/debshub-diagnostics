-- Create classes table for teachers
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade_level INTEGER,
  class_code TEXT UNIQUE NOT NULL DEFAULT upper(substring(md5(random()::text), 1, 6)),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  school_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create class_students junction table
CREATE TABLE public.class_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);

-- Create invitations table for invite-only registration
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'teacher',
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  invited_by UUID NOT NULL REFERENCES public.profiles(id),
  school_name TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Classes policies: Teachers can manage their own classes, admins can see all
CREATE POLICY "Teachers can view own classes" ON public.classes
  FOR SELECT USING (
    teacher_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Teachers can create classes" ON public.classes
  FOR INSERT WITH CHECK (
    teacher_id = auth.uid() AND
    public.has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Teachers can update own classes" ON public.classes
  FOR UPDATE USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own classes" ON public.classes
  FOR DELETE USING (teacher_id = auth.uid());

-- Class students policies
CREATE POLICY "Teachers and admins can view class students" ON public.class_students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE classes.id = class_students.class_id 
      AND (classes.teacher_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    ) OR student_id = auth.uid()
  );

CREATE POLICY "Students can join classes" ON public.class_students
  FOR INSERT WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers can manage class students" ON public.class_students
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.classes 
      WHERE classes.id = class_students.class_id 
      AND classes.teacher_id = auth.uid()
    )
  );

-- Invitations policies: Only admins can manage invitations
CREATE POLICY "Admins can view all invitations" ON public.invitations
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create invitations" ON public.invitations
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update invitations" ON public.invitations
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Function to validate invitation token (security definer for public access)
CREATE OR REPLACE FUNCTION public.validate_invitation(invite_token TEXT)
RETURNS TABLE(email TEXT, role public.app_role, school_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email, role, school_name
  FROM public.invitations
  WHERE token = invite_token
    AND accepted_at IS NULL
    AND expires_at > now()
  LIMIT 1;
$$;

-- Function to mark invitation as accepted
CREATE OR REPLACE FUNCTION public.accept_invitation(invite_token TEXT, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv_record RECORD;
BEGIN
  SELECT * INTO inv_record FROM public.invitations
  WHERE token = invite_token
    AND accepted_at IS NULL
    AND expires_at > now();
    
  IF inv_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.invitations
  SET accepted_at = now()
  WHERE token = invite_token;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id, inv_record.role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Trigger for updated_at on classes
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();