
ALTER TABLE public.profiles
  ADD COLUMN account_status text NOT NULL DEFAULT 'active',
  ADD COLUMN pause_reason text;

-- Allow admins to update any profile (for pausing accounts)
CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
