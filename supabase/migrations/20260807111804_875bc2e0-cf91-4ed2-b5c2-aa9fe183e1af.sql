ALTER TABLE public.reading_diagnostic_transcripts
  ADD COLUMN IF NOT EXISTS grade_level integer;

UPDATE public.reading_diagnostic_transcripts
SET grade_level = CASE
  WHEN grade_band = '1-2' THEN 2
  WHEN grade_band = '3-4' THEN 4
  WHEN grade_band = '5-6' THEN 6
  WHEN grade_band = '7-8' THEN 8
  WHEN grade_band ILIKE 'k%' THEN 0
  WHEN grade_band ~ '^[0-9]{1,2}$' THEN grade_band::int
  ELSE NULL
END
WHERE grade_level IS NULL;