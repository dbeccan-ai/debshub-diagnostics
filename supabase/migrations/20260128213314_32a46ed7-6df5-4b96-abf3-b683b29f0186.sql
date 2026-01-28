-- Add version_a_completed_at and version_b_completed_at to reading_recovery_enrollments
-- to track when each version was completed for unlock logic
ALTER TABLE public.reading_recovery_enrollments
ADD COLUMN IF NOT EXISTS version_a_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS version_b_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create admin roles for dbeccan and dadwitter for Reading Recovery bypass
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('b569e262-cc2e-4d18-9d3d-448d59a19da9', 'admin'),
  ('abf7688d-40c1-4833-8b2c-901f392646d4', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;