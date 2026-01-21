-- Create table for reading diagnostic transcripts and audio metadata
CREATE TABLE public.reading_diagnostic_transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  student_name TEXT NOT NULL,
  passage_title TEXT NOT NULL,
  grade_band TEXT NOT NULL,
  version TEXT NOT NULL,
  original_text TEXT NOT NULL,
  transcript TEXT,
  word_timings JSONB,
  detected_errors JSONB,
  confirmed_errors JSONB,
  final_error_count INTEGER,
  audio_uploaded_at TIMESTAMP WITH TIME ZONE,
  audio_auto_delete_at TIMESTAMP WITH TIME ZONE,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  auto_delete_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reading_diagnostic_transcripts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own transcripts" 
ON public.reading_diagnostic_transcripts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transcripts" 
ON public.reading_diagnostic_transcripts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transcripts" 
ON public.reading_diagnostic_transcripts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transcripts" 
ON public.reading_diagnostic_transcripts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reading_diagnostic_transcripts_updated_at
BEFORE UPDATE ON public.reading_diagnostic_transcripts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for temporary audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('diagnostic-audio', 'diagnostic-audio', false);

-- Create storage policies for audio uploads (private, user-specific)
CREATE POLICY "Users can upload their own audio" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'diagnostic-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own audio" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'diagnostic-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audio" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'diagnostic-audio' AND auth.uid()::text = (storage.foldername(name))[1]);