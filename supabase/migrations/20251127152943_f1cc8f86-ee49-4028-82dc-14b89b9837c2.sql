-- Create storage bucket for certificates
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true);

-- Create RLS policies for certificates bucket
CREATE POLICY "Anyone can view certificates"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates');

CREATE POLICY "System can upload certificates"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificates');