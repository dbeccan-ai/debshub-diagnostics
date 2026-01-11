-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can view school test attempts" ON public.test_attempts;

-- Create new policy that allows admins to view ALL test attempts
CREATE POLICY "Admins can view all test attempts" 
ON public.test_attempts 
FOR SELECT 
USING (
  (auth.uid() = user_id) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    (school_id IS NOT NULL) 
    AND (school_id = get_user_school_id(auth.uid())) 
    AND has_role(auth.uid(), 'teacher'::app_role)
  )
);

-- Also update profiles policy so admin can see all student profiles
DROP POLICY IF EXISTS "Users can view profiles in their school" ON public.profiles;

CREATE POLICY "Users can view profiles" 
ON public.profiles 
FOR SELECT 
USING (
  (auth.uid() = id) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    (school_id IS NOT NULL) 
    AND (school_id = get_user_school_id(auth.uid())) 
    AND has_role(auth.uid(), 'teacher'::app_role)
  )
);

-- Update test_responses policy so admin can view all responses for grading
DROP POLICY IF EXISTS "Users can view own responses" ON public.test_responses;

CREATE POLICY "Users can view responses" 
ON public.test_responses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM test_attempts 
    WHERE test_attempts.id = test_responses.attempt_id 
    AND (
      test_attempts.user_id = auth.uid()
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);