-- Add assessment metadata columns to reading_diagnostic_transcripts
ALTER TABLE public.reading_diagnostic_transcripts
ADD COLUMN IF NOT EXISTS admin_name TEXT,
ADD COLUMN IF NOT EXISTS admin_email TEXT,
ADD COLUMN IF NOT EXISTS assessment_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assessment_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assessment_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS completion_status TEXT DEFAULT 'incomplete',
ADD COLUMN IF NOT EXISTS all_questions_answered BOOLEAN DEFAULT FALSE;