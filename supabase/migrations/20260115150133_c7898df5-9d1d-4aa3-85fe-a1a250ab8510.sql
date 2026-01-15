-- Allow users to delete their own test attempts (for cancellation)
CREATE POLICY "Users can delete own test attempts"
  ON public.test_attempts
  FOR DELETE
  USING (auth.uid() = user_id);