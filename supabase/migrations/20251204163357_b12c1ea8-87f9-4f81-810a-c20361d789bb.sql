-- Add skill_analysis JSONB column for detailed skill tracking
ALTER TABLE public.test_attempts 
ADD COLUMN skill_analysis jsonb DEFAULT '{}';

COMMENT ON COLUMN public.test_attempts.skill_analysis IS 'Detailed skill analysis with mastered skills, skills needing support, and per-skill statistics';