-- Create table to track Reading Recovery programme enrollments (separate from diagnostic test users)
CREATE TABLE public.reading_recovery_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  parent_name TEXT,
  parent_email TEXT NOT NULL,
  grade_level INTEGER,
  reading_challenges TEXT[],
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.reading_recovery_enrollments ENABLE ROW LEVEL SECURITY;

-- Users can view their own enrollment
CREATE POLICY "Users can view their own enrollment"
  ON public.reading_recovery_enrollments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own enrollment
CREATE POLICY "Users can insert their own enrollment"
  ON public.reading_recovery_enrollments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own enrollment
CREATE POLICY "Users can update their own enrollment"
  ON public.reading_recovery_enrollments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create a roadmap progress tracking table
CREATE TABLE public.reading_recovery_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID NOT NULL REFERENCES public.reading_recovery_enrollments(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 21),
  activity_title TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(enrollment_id, day_number)
);

-- Enable RLS
ALTER TABLE public.reading_recovery_progress ENABLE ROW LEVEL SECURITY;

-- Users can manage their own progress
CREATE POLICY "Users can view their own progress"
  ON public.reading_recovery_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reading_recovery_enrollments
      WHERE id = reading_recovery_progress.enrollment_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own progress"
  ON public.reading_recovery_progress
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reading_recovery_enrollments
      WHERE id = reading_recovery_progress.enrollment_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own progress"
  ON public.reading_recovery_progress
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.reading_recovery_enrollments
      WHERE id = reading_recovery_progress.enrollment_id
      AND user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_reading_recovery_enrollments_updated_at
  BEFORE UPDATE ON public.reading_recovery_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();