-- Update accept_invitation function to also set school_id
CREATE OR REPLACE FUNCTION public.accept_invitation(invite_token text, user_id uuid)
RETURNS boolean
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
  
  -- Mark invitation as accepted
  UPDATE public.invitations
  SET accepted_at = now()
  WHERE token = invite_token;
  
  -- Assign role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (user_id, inv_record.role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Set school_id on profile if invitation has one
  IF inv_record.school_id IS NOT NULL THEN
    UPDATE public.profiles
    SET school_id = inv_record.school_id
    WHERE id = user_id;
  END IF;
  
  RETURN TRUE;
END;
$$;